const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const models = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/helpers');

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const user = await models.User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    if (!user.active) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Sign Token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user details
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await models.User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
      active: user.active
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users list
// @access  Private (Super Admin Only)
router.get('/users', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  try {
    const users = await models.User.find();
    // Exclude password field
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/users
// @desc    Register a new user / staff member
// @access  Private (Super Admin Only)
router.post('/users', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  const { username, email, password, role, name } = req.body;

  if (!username || !email || !password || !role || !name) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const existingUser = await models.User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this username or email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await models.User.create({
      username,
      email,
      password: hashedPassword,
      role,
      name,
      active: true
    });

    await logAudit(
      req.user.username,
      'USER_CREATED',
      null,
      `Created user account ${username} as role ${role}`,
      null,
      { username, email, role, name }
    );

    const { password: _, ...safeUser } = newUser;
    res.status(201).json(safeUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during user registration' });
  }
});

// @route   PUT /api/auth/users/:id/toggle
// @desc    Toggle active/deactive status of user
// @access  Private (Super Admin Only)
router.put('/users/:id/toggle', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  try {
    const user = await models.User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.username === req.user.username) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const oldStatus = user.active;
    const updatedUser = await models.User.findByIdAndUpdate(
      req.params.id,
      { active: !oldStatus },
      { new: true }
    );

    await logAudit(
      req.user.username,
      'USER_STATUS_TOGGLED',
      null,
      `Toggled active status of user ${user.username} from ${oldStatus} to ${!oldStatus}`,
      { username: user.username, active: oldStatus },
      { username: user.username, active: !oldStatus }
    );

    res.json({ message: `User status toggled successfully`, active: updatedUser.active });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
