const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit, createNotification } = require('../utils/helpers');
const { sendReceiptEmail } = require('../utils/emailService');

// @route   GET /api/fees/lunch/stats
// @desc    Get Lunch module statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const students = await models.Student.find({ lunchEnrollment: 'Lunch at School' });
    
    let totalEnrolled = students.length;
    let paidStudents = 0;
    let pendingStudents = 0;
    let collectedAmount = 0;
    let pendingAmount = 0;

    const periodStats = {
      Monthly: { period: 'Monthly', studentCount: 0, collected: 0, pending: 0 },
      Quarterly: { period: 'Quarterly', studentCount: 0, collected: 0, pending: 0 },
      Annual: { period: 'Annual', studentCount: 0, collected: 0, pending: 0 }
    };

    students.forEach(s => {
      const period = s.lunchPeriod;
      if (period && periodStats[period]) {
        periodStats[period].studentCount++;
        periodStats[period].collected += s.lunchFee?.amountPaid || 0;
        periodStats[period].pending += s.lunchFee?.balanceAmount || 0;
      }

      collectedAmount += s.lunchFee?.amountPaid || 0;
      pendingAmount += s.lunchFee?.balanceAmount || 0;
      
      if (s.lunchFee?.status === 'Paid') {
        paidStudents++;
      } else {
        pendingStudents++;
      }
    });

    res.json({
      totalEnrolled,
      paidStudents,
      pendingStudents,
      collectedAmount,
      pendingAmount,
      periodBreakdown: Object.values(periodStats)
    });
  } catch (error) {
    console.error('[ERROR] Lunch stats error:', error);
    res.status(500).json({ message: 'Server error compiling lunch stats' });
  }
});

// @route   GET /api/fees/lunch/queue
// @desc    Get queue of students waiting for lunch clearance
// @access  Private
router.get('/queue', authenticate, async (req, res) => {
  try {
    const students = await models.Student.find({ clearanceStatus: 'LUNCH_PENDING' });
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
    res.status(500).json({ message: 'Server error fetching lunch queue' });
  }
});

// @route   POST /api/fees/lunch/collect
// @desc    Process Lunch Fee Payment (Alternative Entry point)
// @access  Private (Uniform Staff and Super Admin)
router.post('/collect', authenticate, authorize(['UNIFORM_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const { 
    studentId, 
    feeAmount, 
    amountPaid, 
    paymentMethod,
    
    // Updates
    lunchEnrollment,
    lunchPeriod
  } = req.body;

  if (!studentId || amountPaid === undefined || !paymentMethod) {
    return res.status(400).json({ message: 'Please provide student details, amount paid, and payment method' });
  }

  try {
    const student = await models.Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const oldStudent = JSON.parse(JSON.stringify(student));
    const oldLunchFee = JSON.parse(JSON.stringify(student.lunchFee || {}));

    // Update Lunch Details & Fee inside the Student document
    if (lunchEnrollment !== undefined) {
      student.lunchEnrollment = lunchEnrollment;
      student.lunchPeriod = lunchPeriod;
      
      let finalFee = Number(feeAmount);
      if (lunchEnrollment === 'Lunch at School' && lunchPeriod) {
        const lnConfig = await models.LunchConfig.findOne({ period: lunchPeriod });
        if (lnConfig) {
          finalFee = lnConfig.feeAmount || 0;
        }
        student.lunchFee.feeAmount = finalFee;
        student.lunchFee.amountPaid = Number(amountPaid);
        student.lunchFee.balanceAmount = 0;
        student.lunchFee.status = 'Paid';
        student.lunchFee.paymentDate = new Date();
        student.lunchFee.paymentMethod = paymentMethod;
        student.lunchFee.updatedBy = req.user.id;
      } else {
        student.lunchFee.feeAmount = 0;
        student.lunchFee.amountPaid = 0;
        student.lunchFee.balanceAmount = 0;
        student.lunchFee.status = 'Not Applicable';
      }
    } else {
      const totalFee = Number(feeAmount);
      const amtPaid = Number(amountPaid);
      if (amtPaid !== totalFee) {
        return res.status(400).json({ message: 'Partial payment is not allowed. Full payment of lunch fees is required.' });
      }
      student.lunchFee.feeAmount = totalFee;
      student.lunchFee.amountPaid = amtPaid;
      student.lunchFee.balanceAmount = 0;
      student.lunchFee.status = 'Paid';
      student.lunchFee.paymentDate = new Date();
      student.lunchFee.paymentMethod = paymentMethod;
      student.lunchFee.updatedBy = req.user.id;
    }

    // Final clearance step
    student.clearanceStatus = 'COMPLETED';
    await student.save();

    const lunchFeeData = {
      ...(student.lunchFee.toObject ? student.lunchFee.toObject() : student.lunchFee),
      student: studentId
    };

    // Find the RequestQueue item and resolve it to APPROVED
    const request = await models.RequestQueue.findOne({
      student: studentId,
      department: 'UNIFORM_DEPT',
      status: 'PENDING'
    });

    if (request) {
      await models.RequestQueue.findByIdAndUpdate(request._id, {
        status: 'APPROVED',
        actionedAt: new Date(),
        actionedBy: req.user.id,
        remarks: 'Uniform, transport, and lunch fees cleared.'
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
        feeType: 'Lunch',
        amount: Number(amountPaid),
        paymentDate: new Date(),
        paymentMethod,
        transactionRef: '',
        staffName: req.user.name
      });

      // Send receipt email immediately in background
      sendReceiptEmail(payment, student).catch(err => {
        console.error('[ERROR] Background lunch receipt email failed:', err);
      });
    }

    // Logs
    await logAudit(
      req.user.username,
      'LUNCH_PAYMENT_SUBMITTED',
      studentId,
      `Processed lunch fee of ₹${amountPaid} for ${student.name}.`,
      oldLunchFee,
      lunchFeeData
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
      message: 'Lunch payment clearance completed successfully. Clearance complete.',
      student,
      payment,
      clearanceStatus: 'COMPLETED'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing lunch payment' });
  }
});

// @route   POST /api/fees/lunch/action
// @desc    Reject lunch clearance (send student back to Transport or Uniform clearance)
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

    // Determine targetStatus: if transport is enrolled and type is School Bus, send back to TRANSPORT_PENDING, else UNIFORM_PENDING
    let targetStatus = 'UNIFORM_PENDING';
    if (student.transportEnrollment === 'Yes' && student.transportType === 'School Bus') {
      targetStatus = 'TRANSPORT_PENDING';
    }

    student.clearanceStatus = targetStatus;

    // Reset lunch fee details
    student.lunchFee.status = 'Pending';
    student.lunchFee.amountPaid = 0;
    student.lunchFee.balanceAmount = student.lunchFee.feeAmount;

    // If sent back to transport pending, reset transport status as well
    if (targetStatus === 'TRANSPORT_PENDING') {
      student.transportFee.status = 'Pending';
      student.transportFee.amountPaid = 0;
      student.transportFee.balanceAmount = student.transportFee.feeAmount;
    }

    await student.save();

    await logAudit(
      req.user.username,
      'LUNCH_REQUEST_REJECTED',
      student._id,
      `Rejected lunch clearance for ${student.name}. Sent back to ${targetStatus === 'TRANSPORT_PENDING' ? 'Transportation' : 'Uniforms'}. Reason: ${remarks || 'None'}`,
      oldStudent.lunchFee,
      student.lunchFee
    );

    await createNotification(
      'Lunch Request Rejected',
      `Lunch clearance for ${student.name} was rejected. Student returned to ${targetStatus === 'TRANSPORT_PENDING' ? 'Transportation' : 'Uniform'} Department.`,
      ['SUPER_ADMIN', 'UNIFORM_DEPT']
    );

    res.json({ message: `Lunch clearance rejected and student sent back to ${targetStatus === 'TRANSPORT_PENDING' ? 'Transportation' : 'Uniforms'}`, student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error actioning request' });
  }
});

module.exports = router;
