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
    
    // Aggregations from nested Student fields
    const students = await models.Student.find({}, 'tuitionFee bookFee uniformFee');

    let tuitionCollected = 0;
    let tuitionPending = 0;
    let bookCollected = 0;
    let bookPending = 0;
    let uniformCollected = 0;
    let uniformPending = 0;

    students.forEach(s => {
      if (s.tuitionFee) {
        tuitionCollected += s.tuitionFee.amountPaid || 0;
        tuitionPending += s.tuitionFee.balanceAmount || 0;
      }
      if (s.bookFee) {
        bookCollected += s.bookFee.amountPaid || 0;
        bookPending += s.bookFee.balanceAmount || 0;
      }
      if (s.uniformFee) {
        uniformCollected += s.uniformFee.amountPaid || 0;
        uniformPending += s.uniformFee.balanceAmount || 0;
      }
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
