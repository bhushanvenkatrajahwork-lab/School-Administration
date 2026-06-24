const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit, createNotification } = require('../utils/helpers');
const { sendReceiptEmail } = require('../utils/emailService');

// @route   GET /api/fees/uniforms/stats
// @desc    Get Uniform Department Dashboard statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const pendingRequests = await models.RequestQueue.countDocuments({
      department: 'UNIFORM_DEPT',
      status: 'PENDING'
    });

    const approvedRequests = await models.RequestQueue.countDocuments({
      department: 'UNIFORM_DEPT',
      status: 'APPROVED'
    });

    const completedDistributions = await models.Student.countDocuments({
      'uniformFee.status': 'Paid'
    });

    res.json({
      pendingRequests,
      approvedRequests,
      completedDistributions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error compiling uniform stats' });
  }
});

// @route   GET /api/fees/uniforms/queue
// @desc    Get queue of students waiting for uniform clearance
// @access  Private
router.get('/queue', authenticate, async (req, res) => {
  try {
    const queue = await models.RequestQueue.find({
      department: 'UNIFORM_DEPT',
      status: 'PENDING'
    }).populate('student');
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching queue' });
  }
});

// @route   POST /api/fees/uniforms/action
// @desc    Accept or Reject a uniform clearance request in the queue
// @access  Private (Uniform Staff and Super Admin)
router.post('/action', authenticate, authorize(['UNIFORM_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const { requestId, action, remarks } = req.body;

  if (!requestId || !action) {
    return res.status(400).json({ message: 'Please provide requestId and action' });
  }

  try {
    const request = await models.RequestQueue.findById(requestId).populate('student');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const student = request.student;
    const oldRequest = JSON.parse(JSON.stringify(request));

    if (action === 'REJECT') {
      const updatedRequest = await models.RequestQueue.findByIdAndUpdate(
        requestId,
        {
          status: 'REJECTED',
          remarks: remarks || 'Rejected by Uniform Department',
          actionedAt: new Date(),
          actionedBy: req.user.id
        },
        { new: true }
      );

      // Revert student status
      await models.Student.findByIdAndUpdate(student._id, { clearanceStatus: 'BOOKS_PENDING' });

      await logAudit(
        req.user.username,
        'UNIFORM_REQUEST_REJECTED',
        student._id,
        `Rejected uniform clearance request for ${student.name}. Reason: ${remarks || 'None'}`,
        oldRequest,
        updatedRequest
      );

      await createNotification(
        'Uniform Request Rejected',
        `Uniform request for ${student.name} was rejected. Student returned to Book Department.`,
        ['SUPER_ADMIN', 'BOOK_DEPT']
      );

      return res.json({ message: 'Request rejected and student sent back to Books', request: updatedRequest });
    }

    res.json({ message: 'Request accepted. Proceed to uniform distribution form.', student });
  } catch (error) {
    res.status(500).json({ message: 'Server error actioning request' });
  }
});

// @route   GET /api/fees/uniforms/config/:class
// @desc    Get uniform configuration for class (auto load items checklist and fee amount)
// @access  Private
router.get('/config/:class', authenticate, async (req, res) => {
  try {
    const { schoolType } = req.query;
    if (!schoolType) {
      return res.status(400).json({ message: 'schoolType query parameter is required' });
    }
    const config = await models.UniformConfig.findOne({
      schoolType,
      class: req.params.class
    });
    if (!config) {
      // Return a default config if not configured by admin yet
      return res.json({
        schoolType,
        class: req.params.class,
        items: ['Shirt', 'Pant', 'Tie', 'Belt', 'ID Card', 'House T-Shirt', 'Sweater', 'Socks'],
        feeAmount: 2500
      });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/fees/uniforms/distribute
// @desc    Submit Uniform Distribution and Fee Payment (Step 1)
// @access  Private (Uniform Staff and Super Admin)
router.post('/distribute', authenticate, authorize(['UNIFORM_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const {
    studentId,
    requestId, // ID of the RequestQueue item
    itemsIssued, // Array of uniform items selected
    feeAmount,
    amountPaid,
    paymentMethod,
    
    // Optional services enrollment updates
    transportEnrollment,
    transportType,
    busRoute,
    busNumber,
    pickupLocation,
    dropLocation,
    boardingPoint,
    lunchEnrollment,
    lunchPeriod
  } = req.body;

  if (!studentId || !requestId || !itemsIssued || amountPaid === undefined || !paymentMethod) {
    return res.status(400).json({ message: 'Please provide student, request, issued items list, fee details, and payment method' });
  }

  try {
    const student = await models.Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const oldStudent = JSON.parse(JSON.stringify(student));

    // Calculate details
    const totalFee = Number(feeAmount);
    const amtPaid = Number(amountPaid);

    if (amtPaid !== totalFee) {
      return res.status(400).json({ message: 'Partial payment is not allowed for Uniform Department. Full payment is required.' });
    }

    const balance = totalFee - amtPaid;
    const status = 'Paid';

    const oldUniformFee = JSON.parse(JSON.stringify(student.uniformFee || {}));

    // Initialize nested schemas if missing/null to avoid TypeErrors
    if (!student.uniformFee) student.uniformFee = {};
    if (!student.transportFee) student.transportFee = {};
    if (!student.lunchFee) student.lunchFee = {};

    // Update nested Uniform Fee details inside the Student document
    const issuedItemsStrings = Array.isArray(itemsIssued) 
      ? itemsIssued.map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            return `${item.name} (Size: ${item.size || 'N/A'})`;
          }
          return '';
        }).filter(Boolean)
      : [];

    student.uniformFee.feeAmount = totalFee;
    student.uniformFee.amountPaid = amtPaid;
    student.uniformFee.balanceAmount = Math.max(0, balance);
    student.uniformFee.status = status;
    student.uniformFee.issuedItems = issuedItemsStrings;
    student.uniformFee.paymentMethod = paymentMethod;
    student.uniformFee.updatedBy = req.user.id;

    // Decrement inventory stock levels for issued items
    if (Array.isArray(itemsIssued)) {
      for (const item of itemsIssued) {
        let name = '';
        let size = 'N/A';
        if (typeof item === 'string') {
          name = item;
        } else if (item && typeof item === 'object') {
          name = item.name;
          size = item.size || 'N/A';
        }

        if (name) {
          const invItem = await models.Inventory.findOne({
            itemType: 'Uniform',
            name,
            size
          });
          if (invItem) {
            const newQty = Math.max(0, (Number(invItem.quantity) || 0) - 1);
            await models.Inventory.findByIdAndUpdate(invItem._id, { quantity: newQty });
          }
        }
      }
    }

    // Save optional services choices if provided
    if (transportEnrollment !== undefined) {
      student.transportEnrollment = transportEnrollment;
      student.transportType = transportType;
      student.busRoute = busRoute || '';
      
      let transportFeeAmount = 0;
      if (transportEnrollment === 'Yes' && transportType === 'School Bus' && busRoute) {
        const transConfig = await models.TransportConfig.findOne({ route: busRoute });
        if (transConfig) {
          transportFeeAmount = transConfig.feeAmount || 0;
          student.busNumber = transConfig.busNumber || busNumber || '';
        }
        student.transportFee.feeAmount = transportFeeAmount;
        student.transportFee.balanceAmount = transportFeeAmount;
        student.transportFee.status = 'Pending';
      } else {
        student.busNumber = '';
        student.transportFee.feeAmount = 0;
        student.transportFee.balanceAmount = 0;
        student.transportFee.status = 'Not Applicable';
      }
      student.pickupLocation = pickupLocation || '';
      student.dropLocation = dropLocation || '';
      student.boardingPoint = boardingPoint || '';
    }

    if (lunchEnrollment !== undefined) {
      student.lunchEnrollment = lunchEnrollment;
      student.lunchPeriod = lunchPeriod;
      
      let lunchFeeAmount = 0;
      if (lunchEnrollment === 'Lunch at School' && lunchPeriod) {
        const lnConfig = await models.LunchConfig.findOne({ period: lunchPeriod });
        if (lnConfig) {
          lunchFeeAmount = lnConfig.feeAmount || 0;
        }
        student.lunchFee.feeAmount = lunchFeeAmount;
        student.lunchFee.balanceAmount = lunchFeeAmount;
        student.lunchFee.status = 'Pending';
      } else {
        student.lunchFee.feeAmount = 0;
        student.lunchFee.balanceAmount = 0;
        student.lunchFee.status = 'Not Applicable';
      }
    }

    // Transition student clearance status based on transport & lunch enrollment
    let nextStatus = 'COMPLETED';
    let isRequestApproved = false;

    if (student.transportEnrollment === 'Yes' && student.transportType === 'School Bus') {
      nextStatus = 'TRANSPORT_PENDING';
    } else if (student.lunchEnrollment === 'Lunch at School') {
      nextStatus = 'LUNCH_PENDING';
    } else {
      isRequestApproved = true;
    }

    student.clearanceStatus = nextStatus;
    await student.save();

    const uniformFeeData = {
      ...(student.uniformFee.toObject ? student.uniformFee.toObject() : student.uniformFee),
      student: studentId
    };

    if (isRequestApproved) {
      // Mark the RequestQueue item as APPROVED
      await models.RequestQueue.findByIdAndUpdate(requestId, {
        status: 'APPROVED',
        actionedAt: new Date(),
        actionedBy: req.user.id,
        remarks: 'Uniform items issued and fee clearance recorded.'
      });
    }

    // Create Transaction Record (Payment Ledger)
    let payment = null;
    if (amtPaid > 0) {
      const pCount = await models.Payment.countDocuments();
      let receiptNumber;
      let isUnique = false;
      let offset = 0;
      while (!isUnique) {
        receiptNumber = `REC${new Date().getFullYear()}${String(pCount + 1 + offset).padStart(6, '0')}`;
        const existingPayment = await models.Payment.findOne({ receiptNumber });
        if (!existingPayment) {
          isUnique = true;
        } else {
          offset++;
        }
      }
      
      payment = await models.Payment.create({
        receiptNumber,
        student: studentId,
        feeType: 'Uniform',
        amount: amtPaid,
        paymentDate: new Date(),
        paymentMethod,
        transactionRef: '',
        staffName: req.user.name
      });

      // Send receipt email immediately in background
      sendReceiptEmail(payment, student).catch(err => {
        console.error('[ERROR] Background receipt email task failed:', err);
      });
    }

    // Logs
    await logAudit(
      req.user.username,
      'UNIFORM_DISTRIBUTION_SUBMITTED',
      studentId,
      `Issued uniform items checklist and processed uniform fee of ₹${amtPaid} for ${student.name}.`,
      oldUniformFee,
      uniformFeeData
    );

    if (isRequestApproved) {
      await logAudit(
        'SYSTEM',
        'STUDENT_WORKFLOW_COMPLETED',
        studentId,
        `Student ${student.name} clearance completed. Marked COMPLETED.`,
        oldStudent,
        student
      );

      await createNotification(
        'Clearance Process Completed',
        `${student.name} (${student.studentId}) has cleared all departments and clearance is completed successfully!`,
        ['SUPER_ADMIN', 'TUITION_DEPT', 'BOOK_DEPT', 'UNIFORM_DEPT']
      );
    }

    res.json({
      message: isRequestApproved 
        ? 'Uniform clearance completed successfully. Clearance complete.' 
        : `Uniform clearance recorded. Proceed to ${nextStatus === 'TRANSPORT_PENDING' ? 'Transportation' : 'Lunch'} clearance.`,
      uniformFee: uniformFeeData,
      payment,
      clearanceStatus: nextStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing uniform distribution' });
  }
});

// @route   POST /api/fees/uniforms/transport
// @desc    Submit Transportation Fee Payment (Step 2)
// @access  Private (Uniform Staff and Super Admin)
router.post('/transport', authenticate, authorize(['UNIFORM_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const { 
    studentId, 
    requestId, 
    feeAmount, 
    amountPaid, 
    paymentMethod,
    
    // Updates
    transportEnrollment,
    transportType,
    busRoute,
    busNumber,
    pickupLocation,
    dropLocation,
    boardingPoint
  } = req.body;

  if (!studentId || !requestId || amountPaid === undefined || !paymentMethod) {
    return res.status(400).json({ message: 'Please provide student, request, fee details, and payment method' });
  }

  try {
    const amtPaid = Number(amountPaid);
    const student = await models.Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const oldStudent = JSON.parse(JSON.stringify(student));
    const oldTransportFee = JSON.parse(JSON.stringify(student.transportFee || {}));

    // Initialize subdocument if missing/null to avoid TypeErrors
    if (!student.transportFee) student.transportFee = {};

    // Update Transport Details & Fee inside the Student document
    if (transportEnrollment !== undefined) {
      student.transportEnrollment = transportEnrollment;
      student.transportType = transportType;
      student.busRoute = busRoute || '';
      
      let finalFee = Number(feeAmount);
      if (transportEnrollment === 'Yes' && transportType === 'School Bus' && busRoute) {
        const transConfig = await models.TransportConfig.findOne({ route: busRoute });
        if (transConfig) {
          finalFee = transConfig.feeAmount || 0;
          student.busNumber = transConfig.busNumber || busNumber || '';
        }
        student.transportFee.feeAmount = finalFee;
        student.transportFee.amountPaid = Number(amountPaid);
        student.transportFee.balanceAmount = 0;
        student.transportFee.status = 'Paid';
        student.transportFee.paymentDate = new Date();
        student.transportFee.paymentMethod = paymentMethod;
        student.transportFee.updatedBy = req.user.id;
      } else {
        student.busNumber = '';
        student.transportFee.feeAmount = 0;
        student.transportFee.amountPaid = 0;
        student.transportFee.balanceAmount = 0;
        student.transportFee.status = 'Not Applicable';
      }
      student.pickupLocation = pickupLocation || '';
      student.dropLocation = dropLocation || '';
      student.boardingPoint = boardingPoint || '';
    } else {
      const totalFee = Number(feeAmount);
      if (amtPaid !== totalFee) {
        return res.status(400).json({ message: 'Partial payment is not allowed. Full payment of transportation fees is required.' });
      }
      student.transportFee.feeAmount = totalFee;
      student.transportFee.amountPaid = amtPaid;
      student.transportFee.balanceAmount = 0;
      student.transportFee.status = 'Paid';
      student.transportFee.paymentDate = new Date();
      student.transportFee.paymentMethod = paymentMethod;
      student.transportFee.updatedBy = req.user.id;
    }

    // Determine next step
    let nextStatus = 'COMPLETED';
    let isRequestApproved = false;

    if (student.lunchEnrollment === 'Lunch at School') {
      nextStatus = 'LUNCH_PENDING';
    } else {
      isRequestApproved = true;
    }

    student.clearanceStatus = nextStatus;
    await student.save();

    const transportFeeData = {
      ...(student.transportFee.toObject ? student.transportFee.toObject() : student.transportFee),
      student: studentId
    };

    if (isRequestApproved) {
      // Mark the RequestQueue item as APPROVED
      await models.RequestQueue.findByIdAndUpdate(requestId, {
        status: 'APPROVED',
        actionedAt: new Date(),
        actionedBy: req.user.id,
        remarks: 'Uniform and transport fees cleared.'
      });
    }

    // Create Transaction Record (Payment Ledger)
    let payment = null;
    if (amtPaid > 0) {
      const pCount = await models.Payment.countDocuments();
      let receiptNumber;
      let isUnique = false;
      let offset = 0;
      while (!isUnique) {
        receiptNumber = `REC${new Date().getFullYear()}${String(pCount + 1 + offset).padStart(6, '0')}`;
        const existingPayment = await models.Payment.findOne({ receiptNumber });
        if (!existingPayment) {
          isUnique = true;
        } else {
          offset++;
        }
      }
      
      payment = await models.Payment.create({
        receiptNumber,
        student: studentId,
        feeType: 'Transportation',
        amount: amtPaid,
        paymentDate: new Date(),
        paymentMethod,
        transactionRef: '',
        staffName: req.user.name
      });

      // Send receipt email immediately in background
      sendReceiptEmail(payment, student).catch(err => {
        console.error('[ERROR] Background transport receipt email failed:', err);
      });
    }

    // Logs
    await logAudit(
      req.user.username,
      'TRANSPORT_PAYMENT_SUBMITTED',
      studentId,
      `Processed transport fee of ₹${amtPaid} for ${student.name}.`,
      oldTransportFee,
      transportFeeData
    );

    if (isRequestApproved) {
      await logAudit(
        'SYSTEM',
        'STUDENT_WORKFLOW_COMPLETED',
        studentId,
        `Student ${student.name} clearance completed. Marked COMPLETED.`,
        oldStudent,
        student
      );

      await createNotification(
        'Clearance Process Completed',
        `${student.name} (${student.studentId}) has cleared all departments and clearance is completed successfully!`,
        ['SUPER_ADMIN', 'TUITION_DEPT', 'BOOK_DEPT', 'UNIFORM_DEPT']
      );
    }

    res.json({
      message: isRequestApproved 
        ? 'Transportation payment clearance completed successfully. Clearance complete.' 
        : 'Transportation payment clearance completed successfully. Proceed to Lunch clearance.',
      student,
      payment,
      clearanceStatus: nextStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing transportation payment' });
  }
});

// @route   POST /api/fees/uniforms/lunch
// @desc    Submit Lunch Fee Payment (Step 3)
// @access  Private (Uniform Staff and Super Admin)
router.post('/lunch', authenticate, authorize(['UNIFORM_DEPT', 'SUPER_ADMIN']), async (req, res) => {
  const { 
    studentId, 
    requestId, 
    feeAmount, 
    amountPaid, 
    paymentMethod,
    
    // Updates
    lunchEnrollment,
    lunchPeriod
  } = req.body;

  if (!studentId || !requestId || amountPaid === undefined || !paymentMethod) {
    return res.status(400).json({ message: 'Please provide student, request, fee details, and payment method' });
  }

  try {
    const amtPaid = Number(amountPaid);
    const student = await models.Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const oldStudent = JSON.parse(JSON.stringify(student));
    const oldLunchFee = JSON.parse(JSON.stringify(student.lunchFee || {}));

    // Initialize subdocument if missing/null to avoid TypeErrors
    if (!student.lunchFee) student.lunchFee = {};

    // Update Lunch Details & Fee inside the Student document
    if (lunchEnrollment !== undefined) {
      student.lunchEnrollment = lunchEnrollment;
      student.lunchPeriod = lunchPeriod;
      
      let finalFee = Number(feeAmount);
      if (lunchEnrollment === 'Lunch at School' && lunchPeriod) {
        const lnConfig = await models.LunchConfig.findOne({ period: lunchPeriod });
        if (lnConfig) {
          finalFee = lnConfig.feeAmount || 0;
        }
        student.lunchFee.feeAmount = finalFee;
        student.lunchFee.amountPaid = Number(amountPaid);
        student.lunchFee.balanceAmount = 0;
        student.lunchFee.status = 'Paid';
        student.lunchFee.paymentDate = new Date();
        student.lunchFee.paymentMethod = paymentMethod;
        student.lunchFee.updatedBy = req.user.id;
      } else {
        student.lunchFee.feeAmount = 0;
        student.lunchFee.amountPaid = 0;
        student.lunchFee.balanceAmount = 0;
        student.lunchFee.status = 'Not Applicable';
      }
    } else {
      const totalFee = Number(feeAmount);
      if (amtPaid !== totalFee) {
        return res.status(400).json({ message: 'Partial payment is not allowed. Full payment of lunch fees is required.' });
      }
      student.lunchFee.feeAmount = totalFee;
      student.lunchFee.amountPaid = amtPaid;
      student.lunchFee.balanceAmount = 0;
      student.lunchFee.status = 'Paid';
      student.lunchFee.paymentDate = new Date();
      student.lunchFee.paymentMethod = paymentMethod;
      student.lunchFee.updatedBy = req.user.id;
    }

    // Transition student clearance status to COMPLETED (Final clearance)
    student.clearanceStatus = 'COMPLETED';
    await student.save();

    const lunchFeeData = {
      ...(student.lunchFee.toObject ? student.lunchFee.toObject() : student.lunchFee),
      student: studentId
    };

    // Mark the RequestQueue item as APPROVED
    await models.RequestQueue.findByIdAndUpdate(requestId, {
      status: 'APPROVED',
      actionedAt: new Date(),
      actionedBy: req.user.id,
      remarks: 'Uniform, transport, and lunch fees cleared.'
    });

    // Create Transaction Record (Payment Ledger)
    let payment = null;
    if (amtPaid > 0) {
      const pCount = await models.Payment.countDocuments();
      let receiptNumber;
      let isUnique = false;
      let offset = 0;
      while (!isUnique) {
        receiptNumber = `REC${new Date().getFullYear()}${String(pCount + 1 + offset).padStart(6, '0')}`;
        const existingPayment = await models.Payment.findOne({ receiptNumber });
        if (!existingPayment) {
          isUnique = true;
        } else {
          offset++;
        }
      }
      
      payment = await models.Payment.create({
        receiptNumber,
        student: studentId,
        feeType: 'Lunch',
        amount: amtPaid,
        paymentDate: new Date(),
        paymentMethod,
        transactionRef: '',
        staffName: req.user.name
      });

      // Send receipt email immediately in background
      sendReceiptEmail(payment, student).catch(err => {
        console.error('[ERROR] Background lunch receipt email failed:', err);
      });
    }

    // Logs
    await logAudit(
      req.user.username,
      'LUNCH_PAYMENT_SUBMITTED',
      studentId,
      `Processed lunch fee of ₹${amtPaid} for ${student.name}.`,
      oldLunchFee,
      lunchFeeData
    );

    await logAudit(
      'SYSTEM',
      'STUDENT_WORKFLOW_COMPLETED',
      studentId,
      `Student ${student.name} clearance completed. Marked COMPLETED.`,
      oldStudent,
      student
    );

    await createNotification(
      'Clearance Process Completed',
      `${student.name} (${student.studentId}) has cleared all departments and clearance is completed successfully!`,
      ['SUPER_ADMIN', 'TUITION_DEPT', 'BOOK_DEPT', 'UNIFORM_DEPT']
    );

    res.json({
      message: 'Lunch payment clearance completed successfully. Clearance complete.',
      student,
      payment,
      clearanceStatus: 'COMPLETED'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error processing lunch payment' });
  }
});

// @route   GET /api/fees/uniforms/requests
// @desc    Get all requests in the request queue for Uniform Department
// @access  Private
router.get('/requests', authenticate, async (req, res) => {
  try {
    const requests = await models.RequestQueue.find({
      department: 'UNIFORM_DEPT'
    }).populate('student');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
