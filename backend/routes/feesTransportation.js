const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit, createNotification } = require('../utils/helpers');
const { sendReceiptEmail } = require('../utils/emailService');

// @route   GET /api/fees/transportation/stats
// @desc    Get Transportation module statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const students = await models.Student.find({ transportEnrollment: 'Yes' });
    
    let totalEnrolled = students.length;
    let schoolBusCount = 0;
    let parentTransportCount = 0;
    let outsourcedTransportCount = 0;
    let paidStudents = 0;
    let pendingStudents = 0;
    let collectedAmount = 0;
    let pendingAmount = 0;

    const routeStats = {};

    students.forEach(s => {
      const type = s.transportType;
      if (type === 'School Bus') {
        schoolBusCount++;
        const route = s.busRoute || 'Unassigned';
        if (!routeStats[route]) {
          routeStats[route] = {
            route,
            studentCount: 0,
            collected: 0,
            pending: 0,
            busNumber: s.busNumber || 'N/A'
          };
        }
        routeStats[route].studentCount++;
        routeStats[route].collected += s.transportFee?.amountPaid || 0;
        routeStats[route].pending += s.transportFee?.balanceAmount || 0;
      } else if (type === 'Parent Transport') {
        parentTransportCount++;
      } else if (type === 'Outsourced Transport') {
        outsourcedTransportCount++;
      }

      if (type === 'School Bus') {
        collectedAmount += s.transportFee?.amountPaid || 0;
        pendingAmount += s.transportFee?.balanceAmount || 0;
        if (s.transportFee?.status === 'Paid') {
          paidStudents++;
        } else {
          pendingStudents++;
        }
      }
    });

    res.json({
      totalEnrolled,
      schoolBusCount,
      parentTransportCount,
      outsourcedTransportCount,
      paidStudents,
      pendingStudents,
      collectedAmount,
      pendingAmount,
      routeBreakdown: Object.values(routeStats)
    });
  } catch (error) {
    console.error('[ERROR] Transportation stats error:', error);
    res.status(500).json({ message: 'Server error compiling transportation stats' });
  }
});

// @route   GET /api/fees/transportation/queue
// @desc    Get queue of students waiting for transportation clearance
// @access  Private
router.get('/queue', authenticate, async (req, res) => {
  try {
    const students = await models.Student.find({ clearanceStatus: 'TRANSPORT_PENDING' });
    const queue = [];
    for (const student of students) {
      const request = await models.RequestQueue.findOne({
        student: student._id,
        department: 'UNIFORM_DEPT',
        status: 'PENDING'
      });
      queue.push({
        _id: request ? request._id : student._id,
        student,
        createdAt: request ? request.createdAt : student.updatedAt
      });
    }
    res.json(queue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching transportation queue' });
  }
});

// @route   POST /api/fees/transportation/collect
// @desc    Process Transportation Fee Payment (Alternative Entry point)
// @access  Private (Uniform Staff and Super Admin)
router.post('/collect', authenticate, authorize(['UNIFORM_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const { 
    studentId, 
    feeAmount, 
    amountPaid, 
    paymentMethod,
    
    // Updates
    transportEnrollment,
    transportType,
    busRoute,
    busNumber,
    pickupLocation,
    dropLocation,
    boardingPoint
  } = req.body;

  if (!studentId || amountPaid === undefined || !paymentMethod) {
    return res.status(400).json({ message: 'Please provide student details, amount paid, and payment method' });
  }

  try {
    const student = await models.Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const oldStudent = JSON.parse(JSON.stringify(student));
    const oldTransportFee = JSON.parse(JSON.stringify(student.transportFee || {}));

    // Update Transport Details & Fee inside the Student document
    if (transportEnrollment !== undefined) {
      student.transportEnrollment = transportEnrollment;
      student.transportType = transportType;
      student.busRoute = busRoute || '';
      
      let finalFee = Number(feeAmount);
      if (transportEnrollment === 'Yes' && transportType === 'School Bus' && busRoute) {
        const transConfig = await models.TransportConfig.findOne({ route: busRoute });
        if (transConfig) {
          finalFee = transConfig.feeAmount || 0;
          student.busNumber = transConfig.busNumber || busNumber || '';
        }
        student.transportFee.feeAmount = finalFee;
        student.transportFee.amountPaid = Number(amountPaid);
        student.transportFee.balanceAmount = 0;
        student.transportFee.status = 'Paid';
        student.transportFee.paymentDate = new Date();
        student.transportFee.paymentMethod = paymentMethod;
        student.transportFee.updatedBy = req.user.id;
      } else {
        student.busNumber = '';
        student.transportFee.feeAmount = 0;
        student.transportFee.amountPaid = 0;
        student.transportFee.balanceAmount = 0;
        student.transportFee.status = 'Not Applicable';
      }
      student.pickupLocation = pickupLocation || '';
      student.dropLocation = dropLocation || '';
      student.boardingPoint = boardingPoint || '';
    } else {
      const totalFee = Number(feeAmount);
      const amtPaid = Number(amountPaid);
      if (amtPaid !== totalFee) {
        return res.status(400).json({ message: 'Partial payment is not allowed. Full payment of transportation fees is required.' });
      }
      student.transportFee.feeAmount = totalFee;
      student.transportFee.amountPaid = amtPaid;
      student.transportFee.balanceAmount = 0;
      student.transportFee.status = 'Paid';
      student.transportFee.paymentDate = new Date();
      student.transportFee.paymentMethod = paymentMethod;
      student.transportFee.updatedBy = req.user.id;
    }

    // Determine next step
    let nextStatus = 'COMPLETED';
    let isRequestApproved = false;

    if (student.lunchEnrollment === 'Lunch at School') {
      nextStatus = 'LUNCH_PENDING';
    } else {
      isRequestApproved = true;
    }

    student.clearanceStatus = nextStatus;
    await student.save();

    const transportFeeData = {
      ...(student.transportFee.toObject ? student.transportFee.toObject() : student.transportFee),
      student: studentId
    };

    // Find the RequestQueue item and resolve it if approved
    const request = await models.RequestQueue.findOne({
      student: studentId,
      department: 'UNIFORM_DEPT',
      status: 'PENDING'
    });

    if (isRequestApproved && request) {
      await models.RequestQueue.findByIdAndUpdate(request._id, {
        status: 'APPROVED',
        actionedAt: new Date(),
        actionedBy: req.user.id,
        remarks: 'Uniform and transport fees cleared.'
      });
    }

    // Create Transaction Record (Payment Ledger)
    let payment = null;
    if (Number(amountPaid) > 0) {
      const pCount = await models.Payment.countDocuments();
      const receiptNumber = `REC${new Date().getFullYear()}${String(pCount + 1).padStart(6, '0')}`;
      
      payment = await models.Payment.create({
        receiptNumber,
        student: studentId,
        feeType: 'Transportation',
        amount: Number(amountPaid),
        paymentDate: new Date(),
        paymentMethod,
        transactionRef: '',
        staffName: req.user.name
      });

      // Send receipt email immediately in background
      sendReceiptEmail(payment, student).catch(err => {
        console.error('[ERROR] Background transport receipt email failed:', err);
      });
    }

    // Logs
    await logAudit(
      req.user.username,
      'TRANSPORT_PAYMENT_SUBMITTED',
      studentId,
      `Processed transport fee of ₹${amountPaid} for ${student.name}.`,
      oldTransportFee,
      transportFeeData
    );

    if (isRequestApproved) {
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
    }

    res.json({
      message: isRequestApproved 
        ? 'Transportation payment clearance completed successfully. Clearance complete.' 
        : 'Transportation payment clearance completed successfully. Proceed to Lunch clearance.',
      student,
      payment,
      clearanceStatus: nextStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing transportation payment' });
  }
});

// @route   POST /api/fees/transportation/action
// @desc    Reject transport clearance (send student back to Uniform clearance)
// @access  Private (Uniform Staff and Super Admin)
router.post('/action', authenticate, authorize(['UNIFORM_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const { studentId, remarks } = req.body;

  if (!studentId) {
    return res.status(400).json({ message: 'Please provide studentId' });
  }

  try {
    const student = await models.Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const oldStudent = JSON.parse(JSON.stringify(student));

    // Revert clearanceStatus to UNIFORM_PENDING
    student.clearanceStatus = 'UNIFORM_PENDING';
    
    // Reset transport fee details
    student.transportFee.status = 'Pending';
    student.transportFee.amountPaid = 0;
    student.transportFee.balanceAmount = student.transportFee.feeAmount;

    await student.save();

    await logAudit(
      req.user.username,
      'TRANSPORT_REQUEST_REJECTED',
      student._id,
      `Rejected transportation clearance for ${student.name}. Sent back to Uniforms. Reason: ${remarks || 'None'}`,
      oldStudent.transportFee,
      student.transportFee
    );

    await createNotification(
      'Transport Request Rejected',
      `Transportation clearance for ${student.name} was rejected. Student returned to Uniform Department.`,
      ['SUPER_ADMIN', 'UNIFORM_DEPT']
    );

    res.json({ message: 'Transport clearance rejected and student sent back to Uniforms', student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error actioning request' });
  }
});

module.exports = router;
