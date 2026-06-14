const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/helpers');

// @route   GET /api/classes
// @desc    Get all classes & sections
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const classes = await models.ClassConfig.find();
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching classes' });
  }
});

// @route   POST /api/classes
// @desc    Create/Update class and sections
// @access  Private (Super Admin Only)
router.post('/', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  const { schoolType, name, sections } = req.body;

  if (!schoolType || !name || !sections) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    let existingClass = await models.ClassConfig.findOne({ schoolType, name });
    
    let result;
    let action = 'CLASS_CREATED';
    let oldVal = null;

    if (existingClass) {
      oldVal = JSON.parse(JSON.stringify(existingClass));
      action = 'CLASS_UPDATED';
      result = await models.ClassConfig.findByIdAndUpdate(
        existingClass._id,
        { sections },
        { new: true }
      );
    } else {
      result = await models.ClassConfig.create({
        schoolType,
        name,
        sections
      });
    }

    await logAudit(
      req.user.username,
      action,
      null,
      `${action === 'CLASS_CREATED' ? 'Created' : 'Updated'} class configuration: ${schoolType} - ${name}`,
      oldVal,
      result
    );

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/classes/:id
// @desc    Delete class config
// @access  Private (Super Admin Only)
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  try {
    const classConfig = await models.ClassConfig.findById(req.params.id);
    if (!classConfig) return res.status(404).json({ message: 'Class config not found' });

    await models.ClassConfig.deleteOne({ _id: req.params.id });

    await logAudit(
      req.user.username,
      'CLASS_DELETED',
      null,
      `Deleted class config: ${classConfig.schoolType} - ${classConfig.name}`,
      classConfig,
      null
    );

    res.json({ message: 'Class config deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/classes/books
// @desc    Get all book configurations
// @access  Private
router.get('/books', authenticate, async (req, res) => {
  try {
    const books = await models.BookConfig.find();
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/classes/books
// @desc    Configure books for a class & school type
// @access  Private (Super Admin Only)
router.post('/books', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  const { schoolType, class: className, books, feeAmount } = req.body;

  if (!schoolType || !className || !books || feeAmount === undefined) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    let existingConfig = await models.BookConfig.findOne({ schoolType, class: className });
    let result;
    let oldVal = null;

    if (existingConfig) {
      oldVal = JSON.parse(JSON.stringify(existingConfig));
      result = await models.BookConfig.findByIdAndUpdate(
        existingConfig._id,
        { books, feeAmount: Number(feeAmount) },
        { new: true }
      );
    } else {
      result = await models.BookConfig.create({
        schoolType,
        class: className,
        books,
        feeAmount: Number(feeAmount)
      });
    }

    await logAudit(
      req.user.username,
      'BOOK_CONFIG_SAVED',
      null,
      `Saved book list and fee config for ${schoolType} - ${className}`,
      oldVal,
      result
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/classes/uniforms
// @desc    Get all uniform configurations
// @access  Private
router.get('/uniforms', authenticate, async (req, res) => {
  try {
    const uniforms = await models.UniformConfig.find();
    res.json(uniforms);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/classes/uniforms
// @desc    Configure uniforms for a class
// @access  Private (Super Admin Only)
router.post('/uniforms', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  const { class: className, items, feeAmount } = req.body;

  if (!className || !items || feeAmount === undefined) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    let existingConfig = await models.UniformConfig.findOne({ class: className });
    let result;
    let oldVal = null;

    if (existingConfig) {
      oldVal = JSON.parse(JSON.stringify(existingConfig));
      result = await models.UniformConfig.findByIdAndUpdate(
        existingConfig._id,
        { items, feeAmount: Number(feeAmount) },
        { new: true }
      );
    } else {
      result = await models.UniformConfig.create({
        class: className,
        items,
        feeAmount: Number(feeAmount)
      });
    }

    await logAudit(
      req.user.username,
      'UNIFORM_CONFIG_SAVED',
      null,
      `Saved uniform items list and fee config for ${className}`,
      oldVal,
      result
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
