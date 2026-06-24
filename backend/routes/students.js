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
    tuitionFeeAmount, // Optional initial tuition fee amount

    // New fields
    transportEnrollment,
    transportType,
    busRoute,
    busNumber,
    pickupLocation,
    dropLocation,
    boardingPoint,
    transportStartDate,
    transportEndDate,
    transportRemarks,
    outsourcedName,
    outsourcedContactPerson,
    outsourcedContactNumber,
    outsourcedRoute,
    outsourcedPickup,
    outsourcedDrop,
    lunchEnrollment,
    lunchPeriod
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

    // Default tuition fee values (typically 12,000 for CBSE, 15,000 for ICSE, or configurable)
    const baseTuition = schoolType === 'CBSE' ? 12000 : 15000;
    const feeAmount = Number(tuitionFeeAmount) || baseTuition;

    // Fetch Transport Config if School Bus is selected
    let transportFeeAmount = 0;
    let finalBusNumber = '';
    if (transportEnrollment === 'Yes' && transportType === 'School Bus' && busRoute) {
      const transConfig = await models.TransportConfig.findOne({ route: busRoute });
      if (transConfig) {
        transportFeeAmount = transConfig.feeAmount || 0;
        finalBusNumber = transConfig.busNumber || busNumber || '';
      }
    }

    // Fetch Lunch Config if Lunch at School is selected
    let lunchFeeAmount = 0;
    if (lunchEnrollment === 'Lunch at School' && lunchPeriod) {
      const lnConfig = await models.LunchConfig.findOne({ period: lunchPeriod });
      if (lnConfig) {
        lunchFeeAmount = lnConfig.feeAmount || 0;
      }
    }

    // Create Student with nested fee schemas
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
      clearanceStatus: 'TUITION_PENDING',
      tuitionFee: {
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
      },
      bookFee: {
        feeAmount: 0,
        amountPaid: 0,
        balanceAmount: 0,
        status: 'Pending',
        issuedBooks: []
      },
      uniformFee: {
        feeAmount: 0,
        amountPaid: 0,
        balanceAmount: 0,
        status: 'Pending',
        issuedItems: []
      },

      // Transportation details
      transportEnrollment: transportEnrollment || 'No',
      transportType: transportType || null,
      busRoute: busRoute || '',
      busNumber: finalBusNumber,
      pickupLocation: pickupLocation || '',
      dropLocation: dropLocation || '',
      boardingPoint: boardingPoint || '',
      transportStartDate: transportStartDate ? new Date(transportStartDate) : null,
      transportEndDate: transportEndDate ? new Date(transportEndDate) : null,
      transportRemarks: transportRemarks || '',
      outsourcedName: outsourcedName || '',
      outsourcedContactPerson: outsourcedContactPerson || '',
      outsourcedContactNumber: outsourcedContactNumber || '',
      outsourcedRoute: outsourcedRoute || '',
      outsourcedPickup: outsourcedPickup || '',
      outsourcedDrop: outsourcedDrop || '',
      transportFee: {
        feeAmount: transportFeeAmount,
        amountPaid: 0,
        balanceAmount: transportFeeAmount,
        status: (transportEnrollment === 'Yes' && transportType === 'School Bus') ? 'Pending' : 'Not Applicable',
        paymentDate: null,
        paymentMethod: null,
        updatedBy: req.user.id
      },

      // Lunch details
      lunchEnrollment: lunchEnrollment || 'Not Taking School Lunch',
      lunchPeriod: lunchPeriod || null,
      lunchFee: {
        feeAmount: lunchFeeAmount,
        amountPaid: 0,
        balanceAmount: lunchFeeAmount,
        status: (lunchEnrollment === 'Lunch at School') ? 'Pending' : 'Not Applicable',
        paymentDate: null,
        paymentMethod: null,
        updatedBy: req.user.id
      }
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

    // Cache configs for bulk lookup
    const allTransportConfigs = await models.TransportConfig.find();
    const allLunchConfigs = await models.LunchConfig.find();

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
        if (req.body.overwriteConflicts) {
          const baseTuition = s.schoolType === 'CBSE' ? 12000 : 15000;
          const feeAmount = Number(s.tuitionFeeAmount) || baseTuition;

          // Fetch Transport Config if School Bus is selected
          let transportFeeAmount = 0;
          let finalBusNumber = '';
          if (s.transportEnrollment === 'Yes' && s.transportType === 'School Bus' && s.busRoute) {
            const transConfig = allTransportConfigs.find(c => c.route.toLowerCase() === s.busRoute.toLowerCase());
            if (transConfig) {
              transportFeeAmount = transConfig.feeAmount || 0;
              finalBusNumber = transConfig.busNumber || s.busNumber || '';
            }
          }

          // Fetch Lunch Config if Lunch at School is selected
          let lunchFeeAmount = 0;
          if (s.lunchEnrollment === 'Lunch at School' && s.lunchPeriod) {
            const lnConfig = allLunchConfigs.find(c => c.period.toLowerCase() === s.lunchPeriod.toLowerCase());
            if (lnConfig) {
              lunchFeeAmount = lnConfig.feeAmount || 0;
            }
          }
          
          await models.Student.updateOne({ admissionNumber: s.admissionNumber }, {
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
            ...(existing.tuitionFee.amountPaid === 0 ? {
              'tuitionFee.feeAmount': feeAmount,
              'tuitionFee.totalAmount': feeAmount,
              'tuitionFee.balanceAmount': feeAmount
            } : {}),
            
            // Transportation fields update
            transportEnrollment: s.transportEnrollment || 'No',
            transportType: s.transportType || null,
            busRoute: s.busRoute || '',
            busNumber: finalBusNumber,
            pickupLocation: s.pickupLocation || '',
            dropLocation: s.dropLocation || '',
            boardingPoint: s.boardingPoint || '',
            transportStartDate: s.transportStartDate ? new Date(s.transportStartDate) : null,
            transportEndDate: s.transportEndDate ? new Date(s.transportEndDate) : null,
            transportRemarks: s.transportRemarks || '',
            outsourcedName: s.outsourcedName || '',
            outsourcedContactPerson: s.outsourcedContactPerson || '',
            outsourcedContactNumber: s.outsourcedContactNumber || '',
            outsourcedRoute: s.outsourcedRoute || '',
            outsourcedPickup: s.outsourcedPickup || '',
            outsourcedDrop: s.outsourcedDrop || '',
            ...(existing.transportFee.amountPaid === 0 ? {
              'transportFee.feeAmount': transportFeeAmount,
              'transportFee.balanceAmount': transportFeeAmount,
              'transportFee.status': (s.transportEnrollment === 'Yes' && s.transportType === 'School Bus') ? 'Pending' : 'Not Applicable'
            } : {}),

            // Lunch fields update
            lunchEnrollment: s.lunchEnrollment || 'Not Taking School Lunch',
            lunchPeriod: s.lunchPeriod || null,
            ...(existing.lunchFee.amountPaid === 0 ? {
              'lunchFee.feeAmount': lunchFeeAmount,
              'lunchFee.balanceAmount': lunchFeeAmount,
              'lunchFee.status': (s.lunchEnrollment === 'Lunch at School') ? 'Pending' : 'Not Applicable'
            } : {})
          });
          successCount++;
          continue;
        } else {
          failCount++;
          errors.push(`Row ${i + 1}: Admission number ${s.admissionNumber} already registered.`);
          continue;
        }
      }

      const studentId = await generateStudentId();
      const baseTuition = s.schoolType === 'CBSE' ? 12000 : 15000;
      const feeAmount = Number(s.tuitionFeeAmount) || baseTuition;

      // Fetch Transport Config if School Bus is selected
      let transportFeeAmount = 0;
      let finalBusNumber = '';
      if (s.transportEnrollment === 'Yes' && s.transportType === 'School Bus' && s.busRoute) {
        const transConfig = allTransportConfigs.find(c => c.route.toLowerCase() === s.busRoute.toLowerCase());
        if (transConfig) {
          transportFeeAmount = transConfig.feeAmount || 0;
          finalBusNumber = transConfig.busNumber || s.busNumber || '';
        }
      }

      // Fetch Lunch Config if Lunch at School is selected
      let lunchFeeAmount = 0;
      if (s.lunchEnrollment === 'Lunch at School' && s.lunchPeriod) {
        const lnConfig = allLunchConfigs.find(c => c.period.toLowerCase() === s.lunchPeriod.toLowerCase());
        if (lnConfig) {
          lunchFeeAmount = lnConfig.feeAmount || 0;
        }
      }

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
        clearanceStatus: 'TUITION_PENDING',
        tuitionFee: {
          feeAmount,
          discount: 0,
          fine: 0,
          totalAmount: feeAmount,
          amountPaid: 0,
          balanceAmount: feeAmount,
          status: 'Pending',
          updatedBy: req.user.id
        },
        bookFee: {
          feeAmount: 0,
          amountPaid: 0,
          balanceAmount: 0,
          status: 'Pending',
          issuedBooks: []
        },
        uniformFee: {
          feeAmount: 0,
          amountPaid: 0,
          balanceAmount: 0,
          status: 'Pending',
          issuedItems: []
        },

        // Transportation fields
        transportEnrollment: s.transportEnrollment || 'No',
        transportType: s.transportType || null,
        busRoute: s.busRoute || '',
        busNumber: finalBusNumber,
        pickupLocation: s.pickupLocation || '',
        dropLocation: s.dropLocation || '',
        boardingPoint: s.boardingPoint || '',
        transportStartDate: s.transportStartDate ? new Date(s.transportStartDate) : null,
        transportEndDate: s.transportEndDate ? new Date(s.transportEndDate) : null,
        transportRemarks: s.transportRemarks || '',
        outsourcedName: s.outsourcedName || '',
        outsourcedContactPerson: s.outsourcedContactPerson || '',
        outsourcedContactNumber: s.outsourcedContactNumber || '',
        outsourcedRoute: s.outsourcedRoute || '',
        outsourcedPickup: s.outsourcedPickup || '',
        outsourcedDrop: s.outsourcedDrop || '',
        transportFee: {
          feeAmount: transportFeeAmount,
          amountPaid: 0,
          balanceAmount: transportFeeAmount,
          status: (s.transportEnrollment === 'Yes' && s.transportType === 'School Bus') ? 'Pending' : 'Not Applicable',
          updatedBy: req.user.id
        },

        // Lunch fields
        lunchEnrollment: s.lunchEnrollment || 'Not Taking School Lunch',
        lunchPeriod: s.lunchPeriod || null,
        lunchFee: {
          feeAmount: lunchFeeAmount,
          amountPaid: 0,
          balanceAmount: lunchFeeAmount,
          status: (s.lunchEnrollment === 'Lunch at School') ? 'Pending' : 'Not Applicable',
          updatedBy: req.user.id
        }
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
    // Fetch student and populate nested update staff names if present (only relevant when database is MongoDB)
    let student;
    if (global.dbMode === 'json') {
      student = await models.Student.findById(req.params.id);
    } else {
      student = await models.Student.findById(req.params.id)
        .populate('tuitionFee.updatedBy')
        .populate('bookFee.updatedBy')
        .populate('uniformFee.updatedBy')
        .populate('transportFee.updatedBy')
        .populate('lunchFee.updatedBy');
    }
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const studentObjectId = student._id;

    // Fetch remaining related logs & entries
    const payments = await models.Payment.find({ student: studentObjectId }).sort({ paymentDate: -1 });
    const requests = await models.RequestQueue.find({ student: studentObjectId }).populate('actionedBy').sort({ createdAt: 1 });
    const audits = await models.AuditLog.find({ student: studentObjectId }).sort({ createdAt: -1 });

    const tuitionData = student.tuitionFee ? { ...(student.tuitionFee.toObject ? student.tuitionFee.toObject() : student.tuitionFee), student: studentObjectId } : null;
    const bookData = student.bookFee ? { ...(student.bookFee.toObject ? student.bookFee.toObject() : student.bookFee), student: studentObjectId } : null;
    const uniformData = student.uniformFee ? { ...(student.uniformFee.toObject ? student.uniformFee.toObject() : student.uniformFee), student: studentObjectId } : null;
    const transportData = student.transportFee ? { ...(student.transportFee.toObject ? student.transportFee.toObject() : student.transportFee), student: studentObjectId } : null;
    const lunchData = student.lunchFee ? { ...(student.lunchFee.toObject ? student.lunchFee.toObject() : student.lunchFee), student: studentObjectId } : null;

    res.json({
      student,
      tuition: tuitionData,
      books: bookData,
      uniform: uniformData,
      transport: transportData,
      lunch: lunchData,
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
