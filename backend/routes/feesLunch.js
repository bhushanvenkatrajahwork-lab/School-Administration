const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate } = require('../middleware/auth');

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

module.exports = router;
