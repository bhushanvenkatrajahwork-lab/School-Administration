const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

// @route   GET /api/audit-logs
// @desc    Get all audit logs
// @access  Private (Super Admin Only)
router.get('/', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  try {
    const logs = await models.AuditLog.find()
      .populate('student')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to latest 100 logs
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
