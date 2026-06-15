const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit, createNotification } = require('../utils/helpers');

// @route   GET /api/fees/uniforms/stats
// @desc    Get Uniform Department Dashboard statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const pendingRequests = await models.RequestQueue.countDocuments({
      department: 'UNIFORM_DEPT',
      status: 'PENDING'
    });

    const approvedRequests = await models.RequestQueue.countDocuments({
      department: 'UNIFORM_DEPT',
      status: 'APPROVED'
    });

    const completedDistributions = await models.Student.countDocuments({
      clearanceStatus: 'COMPLETED'
    });

    res.json({
      pendingRequests,
      approvedRequests,
      completedDistributions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error compiling uniform stats' });
  }
});

// @route   GET /api/fees/uniforms/queue
// @desc    Get queue of students waiting for uniform clearance
// @access  Private
router.get('/queue', authenticate, async (req, res) => {
  try {
    const queue = await models.RequestQueue.find({
      department: 'UNIFORM_DEPT',
      status: 'PENDING'
    }).populate('student');
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching queue' });
  }
});

// @route   POST /api/fees/uniforms/action
// @desc    Accept or Reject a uniform clearance request in the queue
// @access  Private (Uniform Staff and Super Admin)
router.post('/action', authenticate, authorize(['UNIFORM_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const { requestId, action, remarks } = req.body;

  if (!requestId || !action) {
    return res.status(400).json({ message: 'Please provide requestId and action' });
  }

  try {
    const request = await models.RequestQueue.findById(requestId).populate('student');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const student = request.student;
    const oldRequest = JSON.parse(JSON.stringify(request));

    if (action === 'REJECT') {
      const updatedRequest = await models.RequestQueue.findByIdAndUpdate(
        requestId,
        {
          status: 'REJECTED',
          remarks: remarks || 'Rejected by Uniform Department',
          actionedAt: new Date(),
          actionedBy: req.user.id
        },
        { new: true }
      );

      // Revert student status
      await models.Student.findByIdAndUpdate(student._id, { clearanceStatus: 'BOOKS_PENDING' });

      await logAudit(
        req.user.username,
        'UNIFORM_REQUEST_REJECTED',
        student._id,
        `Rejected uniform clearance request for ${student.name}. Reason: ${remarks || 'None'}`,
        oldRequest,
        updatedRequest
      );

      await createNotification(
        'Uniform Request Rejected',
        `Uniform request for ${student.name} was rejected. Student returned to Book Department.`,
        ['SUPER_ADMIN', 'BOOK_DEPT']
      );

      return res.json({ message: 'Request rejected and student sent back to Books', request: updatedRequest });
    }

    res.json({ message: 'Request accepted. Proceed to uniform distribution form.', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error actioning request' });
  }
});

// @route   GET /api/fees/uniforms/config/:class
// @desc    Get uniform configuration for class (auto load items checklist and fee amount)
// @access  Private
router.get('/config/:class', authenticate, async (req, res) => {
  try {
    const config = await models.UniformConfig.findOne({
      class: req.params.class
    });
    if (!config) {
      // Return a default config if not configured by admin yet
      return res.json({
        class: req.params.class,
        items: ['Shirt', 'Pant', 'Tie', 'Belt', 'ID Card', 'House T-Shirt', 'Sweater', 'Socks'],
        feeAmount: 2500
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fees/uniforms/distribute
// @desc    Submit Uniform Distribution and Fee Payment
// @access  Private (Uniform Staff and Super Admin)
router.post('/distribute', authenticate, authorize(['UNIFORM_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const {
    studentId,
    requestId, // ID of the RequestQueue item
    itemsIssued, // Array of uniform items selected
    feeAmount,
    amountPaid,
    paymentMethod
  } = req.body;

  if (!studentId || !requestId || !itemsIssued || amountPaid === undefined || !paymentMethod) {
    return res.status(400).json({ message: 'Please provide student, request, issued items list, fee details, and payment method' });
  }

  try {
    const student = await models.Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const oldStudent = JSON.parse(JSON.stringify(student));

    // Calculate details
    const totalFee = Number(feeAmount);
    const amtPaid = Number(amountPaid);

    if (amtPaid !== totalFee) {
      return res.status(400).json({ message: 'Partial payment is not allowed for Uniform Department. Full payment is required.' });
    }

    const balance = totalFee - amtPaid;
    const status = 'Paid';

    const oldUniformFee = JSON.parse(JSON.stringify(student.uniformFee || {}));

    // Update nested Uniform Fee details inside the Student document
    student.uniformFee.feeAmount = totalFee;
    student.uniformFee.amountPaid = amtPaid;
    student.uniformFee.balanceAmount = Math.max(0, balance);
    student.uniformFee.status = status;
    student.uniformFee.issuedItems = itemsIssued;
    student.uniformFee.paymentMethod = paymentMethod;
    student.uniformFee.updatedBy = req.user.id;

    // Transition student clearance status to COMPLETED (Final clearance)
    student.clearanceStatus = 'COMPLETED';

    await student.save();

    const uniformFeeData = {
      ...(student.uniformFee.toObject ? student.uniformFee.toObject() : student.uniformFee),
      student: studentId
    };

    // Mark the RequestQueue item as APPROVED
    await models.RequestQueue.findByIdAndUpdate(requestId, {
      status: 'APPROVED',
      actionedAt: new Date(),
      actionedBy: req.user.id,
      remarks: 'Uniform items issued and fee clearance recorded.'
    });

    // Create Transaction Record (Payment Ledger)
    let payment = null;
    if (amtPaid > 0) {
      const pCount = await models.Payment.countDocuments();
      const receiptNumber = `REC${new Date().getFullYear()}${String(pCount + 1).padStart(6, '0')}`;
      
      payment = await models.Payment.create({
        receiptNumber,
        student: studentId,
        feeType: 'Uniform',
        amount: amtPaid,
        paymentDate: new Date(),
        paymentMethod,
        transactionRef: '',
        staffName: req.user.name
      });
    }

    // Logs
    await logAudit(
      req.user.username,
      'UNIFORM_DISTRIBUTION_SUBMITTED',
      studentId,
      `Issued uniform items checklist and processed uniform fee of ₹${amtPaid} for ${student.name}. Clearance status: Uniform Cleared.`,
      oldUniformFee,
      uniformFeeData
    );

    await logAudit(
      'SYSTEM',
      'STUDENT_WORKFLOW_COMPLETED',
      studentId,
      `Student ${student.name} clearance completed. Marked COMPLETED.`,
      oldStudent,
      student
    );

    await createNotification(
      'Clearance Process Completed',
      `${student.name} (${student.studentId}) has cleared all departments and clearance is completed successfully!`,
      ['SUPER_ADMIN', 'TUITION_DEPT', 'BOOK_DEPT', 'UNIFORM_DEPT']
    );

    res.json({
      message: 'Uniform distribution and final payment clearance submitted successfully',
      uniformFee: uniformFeeData,
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing uniform distribution' });
  }
});

// @route   GET /api/fees/uniforms/requests
// @desc    Get all requests in the request queue for Uniform Department
// @access  Private
router.get('/requests', authenticate, async (req, res) => {
  try {
    const requests = await models.RequestQueue.find({
      department: 'UNIFORM_DEPT'
    }).populate('student');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
