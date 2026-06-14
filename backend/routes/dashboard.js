const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard metrics and charts data
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const totalStudents = await models.Student.countDocuments();
    
    // Aggregations
    const tuitionFees = await models.TuitionFee.find();
    const bookFees = await models.BookFee.find();
    const uniformFees = await models.UniformFee.find();

    let tuitionCollected = 0;
    let tuitionPending = 0;
    tuitionFees.forEach(t => {
      tuitionCollected += t.amountPaid || 0;
      tuitionPending += t.balanceAmount || 0;
    });

    let bookCollected = 0;
    let bookPending = 0;
    bookFees.forEach(b => {
      bookCollected += b.amountPaid || 0;
      bookPending += b.balanceAmount || 0;
    });

    let uniformCollected = 0;
    let uniformPending = 0;
    uniformFees.forEach(u => {
      uniformCollected += u.amountPaid || 0;
      uniformPending += u.balanceAmount || 0;
    });

    const totalCollected = tuitionCollected + bookCollected + uniformCollected;
    const totalPending = tuitionPending + bookPending + uniformPending;

    // Fetch recent 5 transactions
    const recentTransactions = await models.Payment.find()
      .populate('student')
      .sort({ paymentDate: -1 })
      .limit(6);

    // Fetch recent 8 activities
    const recentActivities = await models.AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(8);

    // Dynamic stats by class for chart (e.g. CBSE vs ICSE student distribution)
    const schoolTypeStats = {
      CBSE: await models.Student.countDocuments({ schoolType: 'CBSE' }),
      ICSE: await models.Student.countDocuments({ schoolType: 'ICSE' })
    };

    // Clearance workflow progression metrics
    const workflowProgress = {
      tuitionPending: await models.Student.countDocuments({ clearanceStatus: 'TUITION_PENDING' }),
      booksPending: await models.Student.countDocuments({ clearanceStatus: 'BOOKS_PENDING' }),
      uniformPending: await models.Student.countDocuments({ clearanceStatus: 'UNIFORM_PENDING' }),
      completed: await models.Student.countDocuments({ clearanceStatus: 'COMPLETED' })
    };

    res.json({
      metrics: {
        totalStudents,
        totalCollected,
        totalPending,
        tuitionCollected,
        tuitionPending,
        bookCollected,
        bookPending,
        uniformCollected,
        uniformPending
      },
      schoolTypeStats,
      workflowProgress,
      recentTransactions,
      recentActivities
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error compiling dashboard metrics' });
  }
});

module.exports = router;
