const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate } = require('../middleware/auth');

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

module.exports = router;
