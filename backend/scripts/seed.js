const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { connectDB } = require('../config/db');
const models = require('../models');

// Load environment variables
dotenv.config();

const seed = async () => {
  console.log('Initializing database connection for seeding...');
  await connectDB();

  try {
    // ----------------------------------------------------
    // 1. CLEAR EXISTING DATA
    // ----------------------------------------------------
    console.log('Clearing existing collections...');
    await models.User.deleteMany({});
    await models.Student.deleteMany({});
    await models.ClassConfig.deleteMany({});
    await models.BookConfig.deleteMany({});
    await models.UniformConfig.deleteMany({});
    await models.TuitionFee.deleteMany({});
    await models.BookFee.deleteMany({});
    await models.UniformFee.deleteMany({});
    await models.RequestQueue.deleteMany({});
    await models.Payment.deleteMany({});
    await models.Notification.deleteMany({});
    await models.AuditLog.deleteMany({});
    console.log('Existing data cleared.');

    // ----------------------------------------------------
    // 2. SEED USERS
    // ----------------------------------------------------
    console.log('Seeding user accounts...');
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = 'password123';
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const users = [
      {
        username: 'admin',
        email: 'admin@school.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        name: 'Principal Sarah Jenkins',
        active: true
      },
      {
        username: 'tuition',
        email: 'tuition@school.com',
        password: hashedPassword,
        role: 'TUITION_DEPT',
        name: 'David Carter (Accounts Officer)',
        active: true
      },
      {
        username: 'books',
        email: 'books@school.com',
        password: hashedPassword,
        role: 'BOOK_DEPT',
        name: 'Elena Rostova (Librarian)',
        active: true
      },
      {
        username: 'uniforms',
        email: 'uniforms@school.com',
        password: hashedPassword,
        role: 'UNIFORM_DEPT',
        name: 'Marcus Vance (Uniform Store Manager)',
        active: true
      }
    ];

    const seededUsers = {};
    for (const u of users) {
      const created = await models.User.create(u);
      seededUsers[u.role] = created;
    }
    console.log('Staff accounts seeded successfully.');

    // ----------------------------------------------------
    // 3. SEED CLASS CONFIGURATIONS
    // ----------------------------------------------------
    console.log('Seeding class configurations...');
    const cbseClasses = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];
    const icseClasses = ['Class I', 'Class II', 'Class III', 'Class IV', 'Class V', 'Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X'];

    for (const c of cbseClasses) {
      await models.ClassConfig.create({
        schoolType: 'CBSE',
        name: c,
        sections: ['A', 'B', 'C']
      });
    }

    for (const c of icseClasses) {
      await models.ClassConfig.create({
        schoolType: 'ICSE',
        name: c,
        sections: ['A', 'B']
      });
    }
    console.log('Classes and sections seeded.');

    // ----------------------------------------------------
    // 4. SEED BOOK CONFIGURATIONS (CLASSES 9 & 10)
    // ----------------------------------------------------
    console.log('Seeding book lists configurations...');
    const booksList = ['English Reader', 'Mathematics', 'General Science', 'Social Science', 'Hindi Grammar', 'Sanskrit', 'Computer Science'];
    await models.BookConfig.create({
      schoolType: 'CBSE',
      class: 'Class 10',
      books: booksList,
      feeAmount: 4200
    });
    await models.BookConfig.create({
      schoolType: 'CBSE',
      class: 'Class 9',
      books: booksList,
      feeAmount: 3800
    });
    await models.BookConfig.create({
      schoolType: 'ICSE',
      class: 'Class X',
      books: [...booksList, 'French Literature'],
      feeAmount: 4800
    });

    // ----------------------------------------------------
    // 5. SEED UNIFORM CONFIGURATIONS
    // ----------------------------------------------------
    console.log('Seeding uniform configurations...');
    const uniformItems = ['Shirt (Boys/Girls)', 'Pant/Skirt', 'Tie', 'Belt', 'Socks (Pack of 2)', 'Black Leather Shoes', 'Sports T-Shirt (House)', 'Sweater (Woolen)'];
    await models.UniformConfig.create({
      class: 'Class 10',
      items: uniformItems,
      feeAmount: 2800
    });
    await models.UniformConfig.create({
      class: 'Class 9',
      items: uniformItems,
      feeAmount: 2600
    });
    await models.UniformConfig.create({
      class: 'Class X',
      items: [...uniformItems, 'Blazer (Navy Blue)'],
      feeAmount: 3500
    });
    console.log('Book and Uniform configurations seeded.');

    // ----------------------------------------------------
    // 6. SEED STUDENTS & PRE-LOAD CLEARANCE WORKFLOWS
    // ----------------------------------------------------
    console.log('Seeding sample students and clearance processes...');
    const studentData = [
      {
        studentId: 'STU20260001',
        admissionNumber: 'ADM2026901',
        name: 'Arjun Sharma',
        gender: 'Male',
        dob: '2011-05-14',
        schoolType: 'CBSE',
        class: 'Class 10',
        section: 'A',
        rollNumber: '101',
        fatherName: 'Rajesh Sharma',
        motherName: 'Sunita Sharma',
        parentMobile: '9876543210',
        email: 'arjun.sharma@school.com',
        address: 'Flat 402, Green Glen Layout, Bangalore',
        academicYear: '2026-2027',
        clearanceStatus: 'TUITION_PENDING',
        tuitionFee: { amount: 15000, paid: 0, status: 'Pending' }
      },
      {
        studentId: 'STU20260002',
        admissionNumber: 'ADM2026902',
        name: 'Priya Patel',
        gender: 'Female',
        dob: '2011-08-22',
        schoolType: 'CBSE',
        class: 'Class 10',
        section: 'A',
        rollNumber: '102',
        fatherName: 'Vikas Patel',
        motherName: 'Nisha Patel',
        parentMobile: '9876543211',
        email: 'priya.patel@school.com',
        address: 'No 15, HSR Layout, Sector 3, Bangalore',
        academicYear: '2026-2027',
        clearanceStatus: 'BOOKS_PENDING',
        tuitionFee: { amount: 15000, paid: 15000, status: 'Paid' }
      },
      {
        studentId: 'STU20260003',
        admissionNumber: 'ADM2026903',
        name: 'Rohan Deshmukh',
        gender: 'Male',
        dob: '2011-03-09',
        schoolType: 'ICSE',
        class: 'Class X',
        section: 'A',
        rollNumber: '103',
        fatherName: 'Anand Deshmukh',
        motherName: 'Preeti Deshmukh',
        parentMobile: '9876543212',
        email: 'rohan.deshmukh@school.com',
        address: 'No 89, Koramangala 4th Block, Bangalore',
        academicYear: '2026-2027',
        clearanceStatus: 'UNIFORM_PENDING',
        tuitionFee: { amount: 18000, paid: 18000, status: 'Paid' },
        bookFee: { amount: 4800, paid: 4800, status: 'Paid', books: ['English Reader', 'Mathematics', 'General Science', 'Social Science', 'Second Language', 'Computer Science', 'French Literature'] }
      },
      {
        studentId: 'STU20260004',
        admissionNumber: 'ADM2026904',
        name: 'Ananya Rao',
        gender: 'Female',
        dob: '2011-12-01',
        schoolType: 'CBSE',
        class: 'Class 9',
        section: 'B',
        rollNumber: '104',
        fatherName: 'Sanjay Rao',
        motherName: 'Kavitha Rao',
        parentMobile: '9876543213',
        email: 'ananya.rao@school.com',
        address: 'Apartment B-11, Prestige Lakeside, Bangalore',
        academicYear: '2026-2027',
        clearanceStatus: 'COMPLETED',
        tuitionFee: { amount: 12000, paid: 12000, status: 'Paid' },
        bookFee: { amount: 3800, paid: 3800, status: 'Paid', books: ['English Reader', 'Mathematics', 'General Science', 'Social Science', 'Hindi Grammar', 'Sanskrit', 'Computer Science'] },
        uniformFee: { amount: 2600, paid: 2600, status: 'Paid', items: ['Shirt (Boys/Girls)', 'Pant/Skirt', 'Tie', 'Belt', 'Socks (Pack of 2)', 'Black Leather Shoes', 'Sports T-Shirt (House)', 'Sweater (Woolen)'] }
      }
    ];

    for (const data of studentData) {
      const { tuitionFee, bookFee, uniformFee, ...studentFlds } = data;
      
      // Save Student
      const student = await models.Student.create(studentFlds);

      // 1. Create Tuition Fee record
      await models.TuitionFee.create({
        student: student._id,
        feeAmount: tuitionFee.amount,
        discount: 0,
        fine: 0,
        totalAmount: tuitionFee.amount,
        amountPaid: tuitionFee.paid,
        balanceAmount: tuitionFee.amount - tuitionFee.paid,
        status: tuitionFee.status,
        paymentDate: tuitionFee.status === 'Paid' ? new Date() : null,
        paymentMethod: tuitionFee.status === 'Paid' ? 'UPI' : null,
        transactionRef: tuitionFee.status === 'Paid' ? 'TXN123456789' : '',
        updatedBy: seededUsers.TUITION_DEPT._id
      });

      // Seeding dependent workflows & payment ledgers
      if (tuitionFee.status === 'Paid') {
        // Create Tuition Ledger Payment entry
        await models.Payment.create({
          receiptNumber: `REC${new Date().getFullYear()}00010${student.rollNumber}`,
          student: student._id,
          feeType: 'Tuition',
          amount: tuitionFee.amount,
          paymentDate: new Date(Date.now() - 3600000 * 24 * 3), // 3 days ago
          paymentMethod: 'UPI',
          transactionRef: 'TXN123456789',
          staffName: seededUsers.TUITION_DEPT.name
        });

        // Audit Log Tuition Paid
        await models.AuditLog.create({
          user: 'tuition',
          action: 'TUITION_PAYMENT_COLLECTED',
          student: student._id,
          details: `Collected tuition payment of ₹${tuitionFee.amount} for ${student.name}. Status: Paid`
        });

        // If Books are not cleared yet, create the Book department request
        if (studentFlds.clearanceStatus === 'BOOKS_PENDING') {
          await models.RequestQueue.create({
            student: student._id,
            department: 'BOOK_DEPT',
            status: 'PENDING',
            remarks: 'Tuition cleared. Routed automatically.'
          });
        }
      }

      // 2. Book Clearance Seeding
      if (bookFee) {
        // Create Book Fee record
        await models.BookFee.create({
          student: student._id,
          feeAmount: bookFee.amount,
          amountPaid: bookFee.paid,
          balanceAmount: bookFee.amount - bookFee.paid,
          status: bookFee.status,
          issuedBooks: bookFee.books,
          paymentMethod: 'Cash',
          updatedBy: seededUsers.BOOK_DEPT._id
        });

        // Create Book Ledger Payment entry
        await models.Payment.create({
          receiptNumber: `REC${new Date().getFullYear()}00020${student.rollNumber}`,
          student: student._id,
          feeType: 'Book',
          amount: bookFee.amount,
          paymentDate: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
          paymentMethod: 'Cash',
          transactionRef: '',
          staffName: seededUsers.BOOK_DEPT.name
        });

        // Request approvals trace
        await models.RequestQueue.create({
          student: student._id,
          department: 'BOOK_DEPT',
          status: 'APPROVED',
          remarks: 'Books issued.',
          actionedAt: new Date(Date.now() - 3600000 * 24 * 2),
          actionedBy: seededUsers.BOOK_DEPT._id
        });

        // Audit logs
        await models.AuditLog.create({
          user: 'books',
          action: 'BOOK_DISTRIBUTION_SUBMITTED',
          student: student._id,
          details: `Issued books checklist and processed book fee of ₹${bookFee.amount} for ${student.name}.`
        });

        // If Uniform is pending
        if (studentFlds.clearanceStatus === 'UNIFORM_PENDING') {
          await models.RequestQueue.create({
            student: student._id,
            department: 'UNIFORM_DEPT',
            status: 'PENDING',
            remarks: 'Books cleared. Routed automatically.'
          });
        }
      }

      // 3. Uniform Clearance Seeding
      if (uniformFee) {
        // Create Uniform Fee record
        await models.UniformFee.create({
          student: student._id,
          feeAmount: uniformFee.amount,
          amountPaid: uniformFee.paid,
          balanceAmount: uniformFee.amount - uniformFee.paid,
          status: uniformFee.status,
          issuedItems: uniformFee.items,
          paymentMethod: 'Card',
          updatedBy: seededUsers.UNIFORM_DEPT._id
        });

        // Create Uniform Ledger Payment entry
        await models.Payment.create({
          receiptNumber: `REC${new Date().getFullYear()}00030${student.rollNumber}`,
          student: student._id,
          feeType: 'Uniform',
          amount: uniformFee.amount,
          paymentDate: new Date(Date.now() - 3600000 * 24 * 1), // 1 day ago
          paymentMethod: 'Card',
          transactionRef: 'CRD_982341',
          staffName: seededUsers.UNIFORM_DEPT.name
        });

        // Request approvals trace
        await models.RequestQueue.create({
          student: student._id,
          department: 'UNIFORM_DEPT',
          status: 'APPROVED',
          remarks: 'Uniform issued.',
          actionedAt: new Date(Date.now() - 3600000 * 24 * 1),
          actionedBy: seededUsers.UNIFORM_DEPT._id
        });

        // Audit logs
        await models.AuditLog.create({
          user: 'uniforms',
          action: 'UNIFORM_DISTRIBUTION_SUBMITTED',
          student: student._id,
          details: `Issued uniform items checklist and processed uniform fee of ₹${uniformFee.amount} for ${student.name}.`
        });

        await models.AuditLog.create({
          user: 'SYSTEM',
          action: 'STUDENT_WORKFLOW_COMPLETED',
          student: student._id,
          details: `Student ${student.name} clearance completed. Marked COMPLETED.`
        });
      }
    }

    // Seed some general notifications
    console.log('Seeding notifications...');
    await models.Notification.create({
      title: 'Welcome to clearance dashboard',
      message: 'System initialization complete. Clearance workflows are live.',
      roles: ['SUPER_ADMIN', 'TUITION_DEPT', 'BOOK_DEPT', 'UNIFORM_DEPT']
    });

    await models.Notification.create({
      title: 'New Student Registered',
      message: 'Arjun Sharma (STU20260001) registered. Tuition fee clearance pending.',
      roles: ['SUPER_ADMIN', 'TUITION_DEPT']
    });

    await models.Notification.create({
      title: 'New Book Clearance Request',
      message: 'Priya Patel (STU20260002) has cleared tuition fees and is queued for book collection.',
      roles: ['SUPER_ADMIN', 'BOOK_DEPT']
    });

    console.log('==================================================');
    console.log('DATABASE SEEDING SUCCESSFUL');
    console.log(`Seeded User Login Credentials:`);
    console.log(`- Super Admin: admin / ${defaultPassword}`);
    console.log(`- Tuition Department: tuition / ${defaultPassword}`);
    console.log(`- Book Department: books / ${defaultPassword}`);
    console.log(`- Uniform Department: uniforms / ${defaultPassword}`);
    console.log('==================================================');

  } catch (error) {
    console.error('CRITICAL: Seeding failed:', error);
  }
};

seed();
