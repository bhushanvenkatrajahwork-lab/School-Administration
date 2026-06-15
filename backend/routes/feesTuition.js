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
    
    // Get all students' tuition info
    const students = await models.Student.find({}, 'tuitionFee');
    const tuitionRecords = students.map(s => s.tuitionFee).filter(Boolean);
    
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
    const student = await models.Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    // Populate updatedBy manually if not JSON fallback mode
    if (global.dbMode !== 'json' && student.tuitionFee && student.tuitionFee.updatedBy) {
      await student.populate('tuitionFee.updatedBy');
    }

    const tuition = {
      ...(student.tuitionFee.toObject ? student.tuitionFee.toObject() : student.tuitionFee),
      student: student
    };
    res.json(tuition);
  } catch (error) {
    console.error(error);
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

    const tuition = student.tuitionFee;
    if (!tuition) return res.status(404).json({ message: 'Tuition record not found' });

    const oldTuition = JSON.parse(JSON.stringify(tuition));

    // Calculate new amounts
    const disc = Number(discount) || 0;
    const fn = Number(fine) || 0;
    const amtPaid = Number(amountPaid);

    const totalAmount = (tuition.feeAmount || 0) - disc + fn;
    const newCumulativePaid = (tuition.amountPaid || 0) + amtPaid;
    const balanceAmount = totalAmount - newCumulativePaid;

    let status = 'Pending';
    if (balanceAmount <= 0) {
      status = 'Paid';
    } else if (newCumulativePaid > 0) {
      status = 'Partial';
    }

    // Update Tuition Fee fields inside the student document
    student.tuitionFee.discount = disc;
    student.tuitionFee.fine = fn;
    student.tuitionFee.totalAmount = totalAmount;
    student.tuitionFee.amountPaid = newCumulativePaid;
    student.tuitionFee.balanceAmount = Math.max(0, balanceAmount);
    student.tuitionFee.status = status;
    student.tuitionFee.paymentDate = new Date();
    student.tuitionFee.paymentMethod = paymentMethod;
    student.tuitionFee.transactionRef = transactionRef || '';
    student.tuitionFee.updatedBy = req.user.id;

    // Workflow transition check
    const oldStudent = JSON.parse(JSON.stringify(student));

    if (status === 'Paid' || status === 'Partial') {
      student.clearanceStatus = 'BOOKS_PENDING';
    }

    await student.save();

    const updatedTuition = {
      ...(student.tuitionFee.toObject ? student.tuitionFee.toObject() : student.tuitionFee),
      student: student
    };

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

    if (status === 'Paid' || status === 'Partial') {
      // Create RequestQueue record for Book Department
      await models.RequestQueue.create({
        student: studentId,
        department: 'BOOK_DEPT',
        status: 'PENDING',
        remarks: 'Tuition fee payment recorded. Routed automatically.'
      });

      // Write workflow transitions logs
      await logAudit(
        'SYSTEM',
        'STUDENT_WORKFLOW_FORWARDED',
        studentId,
        `Student ${student.name} tuition fee payment recorded. Workflow forwarded to Book Department.`,
        oldStudent,
        student
      );

      await createNotification(
        'New Book Clearance Request',
        `${student.name} (${student.studentId}) has paid Tuition Fees and is queued for Book clearance.`,
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
