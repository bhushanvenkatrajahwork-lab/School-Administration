const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/reports/tuition
// @desc    Get Tuition Fee reports
// @access  Private
router.get('/tuition', authenticate, async (req, res) => {
  try {
    const list = await models.TuitionFee.find().populate('student');
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
    const list = await models.BookFee.find().populate('student');
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
    const list = await models.UniformFee.find().populate('student');
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
    const tuitionPending = await models.TuitionFee.find({ balanceAmount: { $gt: 0 } }).populate('student');
    const bookPending = await models.BookFee.find({ balanceAmount: { $gt: 0 } }).populate('student');
    const uniformPending = await models.UniformFee.find({ balanceAmount: { $gt: 0 } }).populate('student');

    // Combine them into a simplified view
    const pendingList = [];
    
    // Add tuition entries
    tuitionPending.forEach(t => {
      if (t.student) {
        pendingList.push({
          studentId: t.student.studentId,
          name: t.student.name,
          classSection: `${t.student.class}-${t.student.section}`,
          admissionNumber: t.student.admissionNumber,
          feeType: 'Tuition',
          totalAmount: t.totalAmount,
          paidAmount: t.amountPaid,
          balanceAmount: t.balanceAmount,
          status: t.status
        });
      }
    });

    // Add book entries
    bookPending.forEach(b => {
      if (b.student) {
        pendingList.push({
          studentId: b.student.studentId,
          name: b.student.name,
          classSection: `${b.student.class}-${b.student.section}`,
          admissionNumber: b.student.admissionNumber,
          feeType: 'Book',
          totalAmount: b.feeAmount,
          paidAmount: b.amountPaid,
          balanceAmount: b.balanceAmount,
          status: b.status
        });
      }
    });

    // Add uniform entries
    uniformPending.forEach(u => {
      if (u.student) {
        pendingList.push({
          studentId: u.student.studentId,
          name: u.student.name,
          classSection: `${u.student.class}-${u.student.section}`,
          admissionNumber: u.student.admissionNumber,
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
      const records = await models.TuitionFee.find().populate('student');
      filename = 'tuition_fee_report.csv';
      csvContent = 'Student ID,Admission No,Student Name,Class,Section,Fee Amount,Discount,Fine,Total,Paid,Balance,Status,Payment Date\n';
      
      records.forEach(r => {
        if (r.student) {
          csvContent += `"${r.student.studentId}","${r.student.admissionNumber}","${r.student.name}","${r.student.class}","${r.student.section}",${r.feeAmount},${r.discount},${r.fine},${r.totalAmount},${r.amountPaid},${r.balanceAmount},"${r.status}","${r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : 'N/A'}"\n`;
        }
      });
    } else if (type === 'books') {
      const records = await models.BookFee.find().populate('student');
      filename = 'book_fee_report.csv';
      csvContent = 'Student ID,Admission No,Student Name,Class,Section,Fee Amount,Paid,Balance,Status,Books Issued\n';
      
      records.forEach(r => {
        if (r.student) {
          const booksStr = (r.issuedBooks || []).join('; ');
          csvContent += `"${r.student.studentId}","${r.student.admissionNumber}","${r.student.name}","${r.student.class}","${r.student.section}",${r.feeAmount},${r.amountPaid},${r.balanceAmount},"${r.status}","${booksStr}"\n`;
        }
      });
    } else if (type === 'uniforms') {
      const records = await models.UniformFee.find().populate('student');
      filename = 'uniform_fee_report.csv';
      csvContent = 'Student ID,Admission No,Student Name,Class,Section,Fee Amount,Paid,Balance,Status,Items Issued\n';
      
      records.forEach(r => {
        if (r.student) {
          const itemsStr = (r.issuedItems || []).join('; ');
          csvContent += `"${r.student.studentId}","${r.student.admissionNumber}","${r.student.name}","${r.student.class}","${r.student.section}",${r.feeAmount},${r.amountPaid},${r.balanceAmount},"${r.status}","${itemsStr}"\n`;
        }
      });
    } else if (type === 'pending') {
      // Fetch tuition, books, uniforms pending
      const tuitionPending = await models.TuitionFee.find({ balanceAmount: { $gt: 0 } }).populate('student');
      const bookPending = await models.BookFee.find({ balanceAmount: { $gt: 0 } }).populate('student');
      const uniformPending = await models.UniformFee.find({ balanceAmount: { $gt: 0 } }).populate('student');
      
      filename = 'pending_fee_report.csv';
      csvContent = 'Student ID,Admission No,Student Name,Class-Section,Fee Type,Total Fee,Amount Paid,Balance Outstanding,Status\n';

      const appendPending = (records, typeLabel, feeFld) => {
        records.forEach(r => {
          if (r.student) {
            const tot = r.totalAmount !== undefined ? r.totalAmount : r.feeAmount;
            csvContent += `"${r.student.studentId}","${r.student.admissionNumber}","${r.student.name}","${r.student.class}-${r.student.section}","${typeLabel}",${tot},${r.amountPaid},${r.balanceAmount},"${r.status}"\n`;
          }
        });
      };

      appendPending(tuitionPending, 'Tuition', 'totalAmount');
      appendPending(bookPending, 'Book', 'feeAmount');
      appendPending(uniformPending, 'Uniform', 'feeAmount');
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
