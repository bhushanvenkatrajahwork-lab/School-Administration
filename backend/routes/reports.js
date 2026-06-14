const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/reports/tuition
// @desc    Get Tuition Fee reports
// @access  Private
router.get('/tuition', authenticate, async (req, res) => {
  try {
    const students = await models.Student.find();
    const list = students.map(s => {
      const tuition = s.tuitionFee ? (s.tuitionFee.toObject ? s.tuitionFee.toObject() : s.tuitionFee) : {};
      return { ...tuition, student: s };
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/books
// @desc    Get Book Fee reports
// @access  Private
router.get('/books', authenticate, async (req, res) => {
  try {
    const students = await models.Student.find();
    const list = students.map(s => {
      const books = s.bookFee ? (s.bookFee.toObject ? s.bookFee.toObject() : s.bookFee) : {};
      return { ...books, student: s };
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/uniforms
// @desc    Get Uniform Fee reports
// @access  Private
router.get('/uniforms', authenticate, async (req, res) => {
  try {
    const students = await models.Student.find();
    const list = students.map(s => {
      const uniforms = s.uniformFee ? (s.uniformFee.toObject ? s.uniformFee.toObject() : s.uniformFee) : {};
      return { ...uniforms, student: s };
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/pending
// @desc    Get reports of pending fees (students with balance > 0)
// @access  Private
router.get('/pending', authenticate, async (req, res) => {
  try {
    const tuitionPending = await models.Student.find({ 'tuitionFee.balanceAmount': { $gt: 0 } });
    const bookPending = await models.Student.find({ 'bookFee.balanceAmount': { $gt: 0 } });
    const uniformPending = await models.Student.find({ 'uniformFee.balanceAmount': { $gt: 0 } });

    // Combine them into a simplified view
    const pendingList = [];
    
    // Add tuition entries
    tuitionPending.forEach(student => {
      const t = student.tuitionFee;
      if (t) {
        pendingList.push({
          studentId: student.studentId,
          name: student.name,
          classSection: `${student.class}-${student.section}`,
          admissionNumber: student.admissionNumber,
          feeType: 'Tuition',
          totalAmount: t.totalAmount,
          paidAmount: t.amountPaid,
          balanceAmount: t.balanceAmount,
          status: t.status
        });
      }
    });

    // Add book entries
    bookPending.forEach(student => {
      const b = student.bookFee;
      if (b) {
        pendingList.push({
          studentId: student.studentId,
          name: student.name,
          classSection: `${student.class}-${student.section}`,
          admissionNumber: student.admissionNumber,
          feeType: 'Book',
          totalAmount: b.feeAmount,
          paidAmount: b.amountPaid,
          balanceAmount: b.balanceAmount,
          status: b.status
        });
      }
    });

    // Add uniform entries
    uniformPending.forEach(student => {
      const u = student.uniformFee;
      if (u) {
        pendingList.push({
          studentId: student.studentId,
          name: student.name,
          classSection: `${student.class}-${student.section}`,
          admissionNumber: student.admissionNumber,
          feeType: 'Uniform',
          totalAmount: u.feeAmount,
          paidAmount: u.amountPaid,
          balanceAmount: u.balanceAmount,
          status: u.status
        });
      }
    });

    res.json(pendingList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/collections
// @desc    Get collection summaries (Daily and Monthly)
// @access  Private
router.get('/collections', authenticate, async (req, res) => {
  try {
    const payments = await models.Payment.find().populate('student');
    
    const today = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let dailyTotal = 0;
    let monthlyTotal = 0;
    let grandTotal = 0;

    const breakdown = {
      Tuition: 0,
      Book: 0,
      Uniform: 0
    };

    payments.forEach(p => {
      const pDate = new Date(p.paymentDate);
      const amt = p.amount;

      grandTotal += amt;
      breakdown[p.feeType] = (breakdown[p.feeType] || 0) + amt;

      // Check daily
      if (pDate.toDateString() === today) {
        dailyTotal += amt;
      }

      // Check monthly
      if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
        monthlyTotal += amt;
      }
    });

    res.json({
      dailyTotal,
      monthlyTotal,
      grandTotal,
      breakdown,
      payments: payments.slice(0, 100) // Return recent transactions
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/clearance
// @desc    Get clearance process statuses for all students
// @access  Private
router.get('/clearance', authenticate, async (req, res) => {
  try {
    const students = await models.Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/export/csv
// @desc    Export specific reports in CSV format
// @access  Private
router.get('/export/csv', authenticate, async (req, res) => {
  const { type } = req.query; // 'tuition', 'books', 'uniforms', 'pending', 'clearance'
  
  try {
    let csvContent = '';
    let filename = 'report.csv';

    if (type === 'tuition') {
      const students = await models.Student.find();
      filename = 'tuition_fee_report.csv';
      csvContent = 'Student ID,Admission No,Student Name,Class,Section,Fee Amount,Discount,Fine,Total,Paid,Balance,Status,Payment Date\n';
      
      students.forEach(s => {
        const r = s.tuitionFee;
        if (r) {
          csvContent += `"${s.studentId}","${s.admissionNumber}","${s.name}","${s.class}","${s.section}",${r.feeAmount || 0},${r.discount || 0},${r.fine || 0},${r.totalAmount || 0},${r.amountPaid || 0},${r.balanceAmount || 0},"${r.status || 'Pending'}","${r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : 'N/A'}"\n`;
        }
      });
    } else if (type === 'books') {
      const students = await models.Student.find();
      filename = 'book_fee_report.csv';
      csvContent = 'Student ID,Admission No,Student Name,Class,Section,Fee Amount,Paid,Balance,Status,Books Issued\n';
      
      students.forEach(s => {
        const r = s.bookFee;
        if (r) {
          const booksStr = (r.issuedBooks || []).join('; ');
          csvContent += `"${s.studentId}","${s.admissionNumber}","${s.name}","${s.class}","${s.section}",${r.feeAmount || 0},${r.amountPaid || 0},${r.balanceAmount || 0},"${r.status || 'Pending'}","${booksStr}"\n`;
        }
      });
    } else if (type === 'uniforms') {
      const students = await models.Student.find();
      filename = 'uniform_fee_report.csv';
      csvContent = 'Student ID,Admission No,Student Name,Class,Section,Fee Amount,Paid,Balance,Status,Items Issued\n';
      
      students.forEach(s => {
        const r = s.uniformFee;
        if (r) {
          const itemsStr = (r.issuedItems || []).join('; ');
          csvContent += `"${s.studentId}","${s.admissionNumber}","${s.name}","${s.class}","${s.section}",${r.feeAmount || 0},${r.amountPaid || 0},${r.balanceAmount || 0},"${r.status || 'Pending'}","${itemsStr}"\n`;
        }
      });
    } else if (type === 'pending') {
      // Fetch tuition, books, uniforms pending
      const tuitionPending = await models.Student.find({ 'tuitionFee.balanceAmount': { $gt: 0 } });
      const bookPending = await models.Student.find({ 'bookFee.balanceAmount': { $gt: 0 } });
      const uniformPending = await models.Student.find({ 'uniformFee.balanceAmount': { $gt: 0 } });
      
      filename = 'pending_fee_report.csv';
      csvContent = 'Student ID,Admission No,Student Name,Class-Section,Fee Type,Total Fee,Amount Paid,Balance Outstanding,Status\n';

      tuitionPending.forEach(s => {
        const r = s.tuitionFee;
        if (r) {
          csvContent += `"${s.studentId}","${s.admissionNumber}","${s.name}","${s.class}-${s.section}","Tuition",${r.totalAmount || 0},${r.amountPaid || 0},${r.balanceAmount || 0},"${r.status || 'Pending'}"\n`;
        }
      });

      bookPending.forEach(s => {
        const r = s.bookFee;
        if (r) {
          csvContent += `"${s.studentId}","${s.admissionNumber}","${s.name}","${s.class}-${s.section}","Book",${r.feeAmount || 0},${r.amountPaid || 0},${r.balanceAmount || 0},"${r.status || 'Pending'}"\n`;
        }
      });

      uniformPending.forEach(s => {
        const r = s.uniformFee;
        if (r) {
          csvContent += `"${s.studentId}","${s.admissionNumber}","${s.name}","${s.class}-${s.section}","Uniform",${r.feeAmount || 0},${r.amountPaid || 0},${r.balanceAmount || 0},"${r.status || 'Pending'}"\n`;
        }
      });
    } else if (type === 'clearance') {
      const records = await models.Student.find();
      filename = 'clearance_report.csv';
      csvContent = 'Student ID,Admission No,Student Name,Class,Section,School Type,Clearance Status,Academic Year\n';
      
      records.forEach(r => {
        csvContent += `"${r.studentId}","${r.admissionNumber}","${r.name}","${r.class}","${r.section}","${r.schoolType}","${r.clearanceStatus}","${r.academicYear}"\n`;
      });
    } else {
      return res.status(400).json({ message: 'Invalid export report type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating export' });
  }
});

module.exports = router;
