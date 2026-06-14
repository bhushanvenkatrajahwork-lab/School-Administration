const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit, createNotification } = require('../utils/helpers');

// @route   GET /api/fees/tuition/stats
// @desc    Get Tuition Fee Dashboard statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalStudents = await models.Student.countDocuments();
    
    // Aggregate tuition metrics
    const tuitionRecords = await models.TuitionFee.find();
    
    let paidStudents = 0;
    let pendingStudents = 0;
    let collectedAmount = 0;
    let pendingAmount = 0;

    tuitionRecords.forEach(rec => {
      collectedAmount += rec.amountPaid || 0;
      pendingAmount += rec.balanceAmount || 0;
      
      if (rec.status === 'Paid') {
        paidStudents++;
      } else {
        pendingStudents++;
      }
    });

    res.json({
      totalStudents,
      paidStudents,
      pendingStudents,
      collectedAmount,
      pendingAmount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error compiling tuition stats' });
  }
});

// @route   GET /api/fees/tuition/student/:studentId
// @desc    Fetch tuition details by student ID (mongo ID)
// @access  Private
router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const tuition = await models.TuitionFee.findOne({ student: req.params.studentId }).populate('student');
    if (!tuition) return res.status(404).json({ message: 'Tuition record not found for student' });
    res.json(tuition);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fees/tuition/collect
// @desc    Submit Tuition Fee payment
// @access  Private (Tuition Staff and Super Admin)
router.post('/collect', authenticate, authorize(['TUITION_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const {
    studentId, // This is the Student DB _id
    discount,
    fine,
    amountPaid,
    paymentMethod,
    transactionRef
  } = req.body;

  if (!studentId || amountPaid === undefined || !paymentMethod) {
    return res.status(400).json({ message: 'Please provide student, amount paid, and payment method' });
  }

  try {
    const student = await models.Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const tuition = await models.TuitionFee.findOne({ student: studentId });
    if (!tuition) return res.status(404).json({ message: 'Tuition record not found' });

    const oldTuition = JSON.parse(JSON.stringify(tuition));

    // Calculate new amounts
    const disc = Number(discount) || 0;
    const fn = Number(fine) || 0;
    const amtPaid = Number(amountPaid);

    const totalAmount = tuition.feeAmount - disc + fn;
    const newCumulativePaid = (tuition.amountPaid || 0) + amtPaid;
    const balanceAmount = totalAmount - newCumulativePaid;

    let status = 'Pending';
    if (balanceAmount <= 0) {
      status = 'Paid';
    } else if (newCumulativePaid > 0) {
      status = 'Partial';
    }

    // Update Tuition Fee record
    const updatedTuition = await models.TuitionFee.findOneAndUpdate(
      { student: studentId },
      {
        discount: disc,
        fine: fn,
        totalAmount,
        amountPaid: newCumulativePaid,
        balanceAmount: Math.max(0, balanceAmount),
        status,
        paymentDate: new Date(),
        paymentMethod,
        transactionRef: transactionRef || '',
        updatedBy: req.user.id
      },
      { new: true }
    );

    // Generate Transaction Record (Payment Ledger)
    const pCount = await models.Payment.countDocuments();
    const receiptNumber = `REC${new Date().getFullYear()}${String(pCount + 1).padStart(6, '0')}`;
    
    const payment = await models.Payment.create({
      receiptNumber,
      student: studentId,
      feeType: 'Tuition',
      amount: amtPaid,
      paymentDate: new Date(),
      paymentMethod,
      transactionRef: transactionRef || '',
      staffName: req.user.name
    });

    // Write audit log for the payment transaction
    await logAudit(
      req.user.username,
      'TUITION_PAYMENT_COLLECTED',
      studentId,
      `Collected tuition payment of ₹${amtPaid} via ${paymentMethod} for student ${student.name}. Status: ${status}`,
      oldTuition,
      updatedTuition
    );

    // Workflow transition check
    if (status === 'Paid') {
      const oldStudent = JSON.parse(JSON.stringify(student));
      
      // Update student status to Tuition Cleared and transition to Books Pending
      const updatedStudent = await models.Student.findByIdAndUpdate(
        studentId,
        { clearanceStatus: 'BOOKS_PENDING' },
        { new: true }
      );

      // Create RequestQueue record for Book Department
      await models.RequestQueue.create({
        student: studentId,
        department: 'BOOK_DEPT',
        status: 'PENDING',
        remarks: 'Tuition cleared. Routed automatically.'
      });

      // Write workflow transitions logs
      await logAudit(
        'SYSTEM',
        'STUDENT_WORKFLOW_FORWARDED',
        studentId,
        `Student ${student.name} tuition status marked cleared. Workflow forwarded to Book Department.`,
        oldStudent,
        updatedStudent
      );

      await createNotification(
        'New Book Clearance Request',
        `${student.name} (${student.studentId}) has cleared Tuition Fees and is queued for Book clearance.`,
        ['SUPER_ADMIN', 'BOOK_DEPT']
      );
    }

    res.json({
      message: 'Tuition fee payment processed successfully',
      tuition: updatedTuition,
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing tuition payment' });
  }
});

module.exports = router;
