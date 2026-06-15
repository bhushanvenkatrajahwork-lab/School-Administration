const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit, createNotification } = require('../utils/helpers');

// @route   GET /api/fees/books/stats
// @desc    Get Book Department Dashboard statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const pendingRequests = await models.RequestQueue.countDocuments({
      department: 'BOOK_DEPT',
      status: 'PENDING'
    });

    const approvedRequests = await models.RequestQueue.countDocuments({
      department: 'BOOK_DEPT',
      status: 'APPROVED'
    });

    const completedDistributions = await models.Student.countDocuments({
      clearanceStatus: { $in: ['BOOKS_CLEARED', 'UNIFORM_PENDING', 'UNIFORM_CLEARED', 'COMPLETED'] }
    });

    res.json({
      pendingRequests,
      approvedRequests,
      completedDistributions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error compiling book stats' });
  }
});

// @route   GET /api/fees/books/queue
// @desc    Get queue of students waiting for book clearance
// @access  Private
router.get('/queue', authenticate, async (req, res) => {
  try {
    const queue = await models.RequestQueue.find({
      department: 'BOOK_DEPT',
      status: 'PENDING'
    }).populate('student');
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching queue' });
  }
});

// @route   POST /api/fees/books/action
// @desc    Accept or Reject a book clearance request in the queue
// @access  Private (Book Staff and Super Admin)
router.post('/action', authenticate, authorize(['BOOK_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const { requestId, action, remarks } = req.body; // action: 'ACCEPT' or 'REJECT'

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
          remarks: remarks || 'Rejected by Book Department',
          actionedAt: new Date(),
          actionedBy: req.user.id
        },
        { new: true }
      );

      // Revert student status
      await models.Student.findByIdAndUpdate(student._id, { clearanceStatus: 'TUITION_PENDING' });

      await logAudit(
        req.user.username,
        'BOOK_REQUEST_REJECTED',
        student._id,
        `Rejected book clearance request for ${student.name}. Reason: ${remarks || 'None'}`,
        oldRequest,
        updatedRequest
      );

      await createNotification(
        'Book Request Rejected',
        `Book request for ${student.name} was rejected. Student returned to Tuition Department.`,
        ['SUPER_ADMIN', 'TUITION_DEPT']
      );

      return res.json({ message: 'Request rejected and student sent back to Tuition', request: updatedRequest });
    }

    // If accepted, we mark request as accepted and return the student details so the frontend can show the distribution form
    // We don't mark as BOOKS_CLEARED yet. That happens when they submit the book distribution checklist and payment.
    res.json({ message: 'Request accepted. Proceed to book distribution form.', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error actioning request' });
  }
});

// @route   GET /api/fees/books/config/:schoolType/:class
// @desc    Get book configuration for class (auto load books list and fee amount)
// @access  Private
router.get('/config/:schoolType/:class', authenticate, async (req, res) => {
  try {
    const config = await models.BookConfig.findOne({
      schoolType: req.params.schoolType,
      class: req.params.class
    });
    if (!config) {
      // Return a default config if not configured by admin yet
      return res.json({
        schoolType: req.params.schoolType,
        class: req.params.class,
        books: ['English', 'Mathematics', 'Science', 'Social Science', 'Second Language', 'Computer Science'],
        feeAmount: 3500
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fees/books/distribute
// @desc    Submit Book Distribution and Fee Payment
// @access  Private (Book Staff and Super Admin)
router.post('/distribute', authenticate, authorize(['BOOK_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const {
    studentId,
    requestId, // ID of the RequestQueue item
    booksIssued, // Array of books selected
    feeAmount,
    amountPaid,
    paymentMethod
  } = req.body;

  if (!studentId || !requestId || !booksIssued || amountPaid === undefined || !paymentMethod) {
    return res.status(400).json({ message: 'Please provide student, request, issued books list, fee details, and payment method' });
  }

  const issuedBooks = booksIssued;
  try {
    const student = await models.Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const oldStudent = JSON.parse(JSON.stringify(student));

    // Calculate details
    const totalFee = Number(feeAmount);
    const amtPaid = Number(amountPaid);

    if (amtPaid !== totalFee) {
      return res.status(400).json({ message: 'Partial payment is not allowed for Book Department. Full payment is required.' });
    }

    const balance = totalFee - amtPaid;
    const status = 'Paid';

    const oldBookFee = JSON.parse(JSON.stringify(student.bookFee || {}));

    // Update nested Book Fee details inside the Student document
    student.bookFee.feeAmount = totalFee;
    student.bookFee.amountPaid = amtPaid;
    student.bookFee.balanceAmount = Math.max(0, balance);
    student.bookFee.status = status;
    student.bookFee.issuedBooks = issuedBooks;
    student.bookFee.paymentMethod = paymentMethod;
    student.bookFee.updatedBy = req.user.id;

    // Transition student clearance status to Books Cleared -> Uniform Pending
    student.clearanceStatus = 'UNIFORM_PENDING';

    await student.save();

    const bookFeeData = {
      ...(student.bookFee.toObject ? student.bookFee.toObject() : student.bookFee),
      student: studentId
    };

    // Mark the RequestQueue item as APPROVED
    await models.RequestQueue.findByIdAndUpdate(requestId, {
      status: 'APPROVED',
      actionedAt: new Date(),
      actionedBy: req.user.id,
      remarks: 'Books issued and fee clearance recorded.'
    });

    // Create Transaction Record (Payment Ledger)
    let payment = null;
    if (amtPaid > 0) {
      const pCount = await models.Payment.countDocuments();
      const receiptNumber = `REC${new Date().getFullYear()}${String(pCount + 1).padStart(6, '0')}`;
      
      payment = await models.Payment.create({
        receiptNumber,
        student: studentId,
        feeType: 'Book',
        amount: amtPaid,
        paymentDate: new Date(),
        paymentMethod,
        transactionRef: '',
        staffName: req.user.name
      });
    }

    // Create RequestQueue record for Uniform Department
    await models.RequestQueue.create({
      student: studentId,
      department: 'UNIFORM_DEPT',
      status: 'PENDING',
      remarks: 'Books cleared. Routed automatically.'
    });

    // Logs
    await logAudit(
      req.user.username,
      'BOOK_DISTRIBUTION_SUBMITTED',
      studentId,
      `Issued books checklist and processed book fee of ₹${amtPaid} for ${student.name}. Clearance status: Books Cleared.`,
      oldBookFee,
      bookFeeData
    );

    await logAudit(
      'SYSTEM',
      'STUDENT_WORKFLOW_FORWARDED',
      studentId,
      `Student ${student.name} books cleared. Workflow forwarded to Uniform Department.`,
      oldStudent,
      student
    );

    await createNotification(
      'New Uniform Clearance Request',
      `${student.name} (${student.studentId}) has cleared Books and is queued for Uniform clearance.`,
      ['SUPER_ADMIN', 'UNIFORM_DEPT']
    );

    res.json({
      message: 'Book distribution and payment clearance submitted successfully',
      bookFee: bookFeeData,
      payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing book distribution' });
  }
});

// @route   GET /api/fees/books/requests
// @desc    Get all requests in the request queue for Book Department
// @access  Private
router.get('/requests', authenticate, async (req, res) => {
  try {
    const requests = await models.RequestQueue.find({
      department: 'BOOK_DEPT'
    }).populate('student');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
