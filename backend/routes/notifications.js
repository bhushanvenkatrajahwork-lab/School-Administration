const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get notifications for the logged in user's role
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const list = await models.Notification.find({
      roles: req.user.role
    }).sort({ createdAt: -1 });
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.post('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await models.Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    if (!notification.readBy.includes(req.user.id.toString())) {
      await models.Notification.findByIdAndUpdate(
        req.params.id,
        { $push: { readBy: req.user.id.toString() } },
        { new: true }
      );
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
