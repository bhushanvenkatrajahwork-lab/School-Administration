const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit, createNotification } = require('../utils/helpers');

// Helper to generate a unique Student ID
async function generateStudentId() {
  try {
    const count = await models.Student.countDocuments();
    const year = new Date().getFullYear();
    const sequence = String(count + 1).padStart(4, '0');
    return `STU${year}${sequence}`;
  } catch (error) {
    // Fallback in case of database issues
    return `STU${Date.now().toString().slice(-8)}`;
  }
}

// @route   GET /api/students
// @desc    Get students filtered by schoolType, class, section (Dependent dropdown lookup)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  const { schoolType, class: className, section } = req.query;
  const filter = {};
  
  if (schoolType) filter.schoolType = schoolType;
  if (className) filter.class = className;
  if (section) filter.section = section;

  try {
    const students = await models.Student.find(filter);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/students/search
// @desc    Global Instant Search by Name, Admission Number, Roll Number, Parent Mobile
// @access  Private
router.get('/search', authenticate, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const regexQuery = { $regex: q, $options: 'i' };
  
  const query = {
    $or: [
      { name: regexQuery },
      { admissionNumber: regexQuery },
      { rollNumber: regexQuery },
      { parentMobile: regexQuery },
      { studentId: regexQuery }
    ]
  };

  try {
    const students = await models.Student.find(query).limit(10);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error during student search' });
  }
});

// @route   GET /api/students/:id
// @desc    Get student profile details
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const student = await models.Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/students
// @desc    Manually create a student
// @access  Private (Super Admin Only)
router.post('/', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  const {
    admissionNumber,
    name,
    gender,
    dob,
    schoolType,
    class: className,
    section,
    rollNumber,
    fatherName,
    motherName,
    parentMobile,
    email,
    address,
    academicYear,
    tuitionFeeAmount // Optional initial tuition fee amount
  } = req.body;

  if (!admissionNumber || !name || !gender || !dob || !schoolType || !className || !section || !rollNumber || !fatherName || !motherName || !parentMobile || !address || !academicYear) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    // Check if admission number is already taken
    const existing = await models.Student.findOne({ admissionNumber });
    if (existing) {
      return res.status(400).json({ message: 'Admission number is already registered' });
    }

    const studentId = await generateStudentId();

    // Create Student
    const student = await models.Student.create({
      studentId,
      admissionNumber,
      name,
      gender,
      dob: new Date(dob),
      schoolType,
      class: className,
      section,
      rollNumber,
      fatherName,
      motherName,
      parentMobile,
      email: email || '',
      address,
      academicYear,
      clearanceStatus: 'TUITION_PENDING'
    });

    // Default tuition fee values (typically 12,000 for CBSE, 15,000 for ICSE, or configurable)
    const baseTuition = schoolType === 'CBSE' ? 12000 : 15000;
    const feeAmount = Number(tuitionFeeAmount) || baseTuition;

    // Initialize Tuition Fee Record
    await models.TuitionFee.create({
      student: student._id,
      feeAmount,
      discount: 0,
      fine: 0,
      totalAmount: feeAmount,
      amountPaid: 0,
      balanceAmount: feeAmount,
      status: 'Pending',
      paymentDate: null,
      paymentMethod: null,
      transactionRef: '',
      updatedBy: req.user.id
    });

    await logAudit(
      req.user.username,
      'STUDENT_CREATED',
      student._id,
      `Registered new student: ${name} (${studentId}) under ${schoolType} ${className}-${section}`,
      null,
      student
    );

    await createNotification(
      'New Student Registered',
      `${name} (${studentId}) registered in ${schoolType} ${className}-${section}. Tuition fee payment pending.`,
      ['SUPER_ADMIN', 'TUITION_DEPT']
    );

    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during student creation' });
  }
});

// @route   POST /api/students/import
// @desc    Bulk student import
// @access  Private (Super Admin Only)
router.post('/import', authenticate, authorize(['SUPER_ADMIN']), async (req, res) => {
  const { students } = req.body; // Expects an array of students

  if (!students || !Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ message: 'Please provide an array of students to import' });
  }

  try {
    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Process each student sequentially to ensure IDs are generated correctly
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      if (!s.admissionNumber || !s.name || !s.gender || !s.dob || !s.schoolType || !s.class || !s.section || !s.rollNumber || !s.fatherName || !s.motherName || !s.parentMobile || !s.address || !s.academicYear) {
        failCount++;
        errors.push(`Row ${i + 1}: Missing required fields.`);
        continue;
      }

      const existing = await models.Student.findOne({ admissionNumber: s.admissionNumber });
      if (existing) {
        failCount++;
        errors.push(`Row ${i + 1}: Admission number ${s.admissionNumber} already exists.`);
        continue;
      }

      const studentId = await generateStudentId();
      const student = await models.Student.create({
        studentId,
        admissionNumber: s.admissionNumber,
        name: s.name,
        gender: s.gender,
        dob: new Date(s.dob),
        schoolType: s.schoolType,
        class: s.class,
        section: s.section,
        rollNumber: s.rollNumber,
        fatherName: s.fatherName,
        motherName: s.motherName,
        parentMobile: s.parentMobile,
        email: s.email || '',
        address: s.address,
        academicYear: s.academicYear,
        clearanceStatus: 'TUITION_PENDING'
      });

      const baseTuition = s.schoolType === 'CBSE' ? 12000 : 15000;
      const feeAmount = Number(s.tuitionFeeAmount) || baseTuition;

      await models.TuitionFee.create({
        student: student._id,
        feeAmount,
        discount: 0,
        fine: 0,
        totalAmount: feeAmount,
        amountPaid: 0,
        balanceAmount: feeAmount,
        status: 'Pending',
        updatedBy: req.user.id
      });

      successCount++;
    }

    await logAudit(
      req.user.username,
      'STUDENT_BULK_IMPORT',
      null,
      `Bulk imported ${successCount} students successfully (${failCount} failed)`,
      null,
      { successCount, failCount }
    );

    await createNotification(
      'Bulk Student Import Completed',
      `${successCount} students imported by Admin. Tuition fees pending.`,
      ['SUPER_ADMIN', 'TUITION_DEPT']
    );

    res.json({
      message: `Import processed. Successfully imported: ${successCount}. Failed: ${failCount}.`,
      successCount,
      failCount,
      errors
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during bulk import' });
  }
});

// @route   GET /api/students/:id/history
// @desc    Get complete unified timeline and clearance history for student
// @access  Private
router.get('/:id/history', authenticate, async (req, res) => {
  try {
    const student = await models.Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const studentObjectId = student._id;

    // Fetch related logs & entries
    const tuition = await models.TuitionFee.findOne({ student: studentObjectId }).populate('updatedBy');
    const books = await models.BookFee.findOne({ student: studentObjectId }).populate('updatedBy');
    const uniform = await models.UniformFee.findOne({ student: studentObjectId }).populate('updatedBy');
    const payments = await models.Payment.find({ student: studentObjectId }).sort({ paymentDate: -1 });
    const requests = await models.RequestQueue.find({ student: studentObjectId }).populate('actionedBy').sort({ createdAt: 1 });
    const audits = await models.AuditLog.find({ student: studentObjectId }).sort({ createdAt: -1 });

    res.json({
      student,
      tuition: tuition || null,
      books: books || null,
      uniform: uniform || null,
      payments: payments || [],
      workflowHistory: requests || [],
      activityHistory: audits || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error compiling student history' });
  }
});

module.exports = router;
