const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const models = require('./models');
const { connectDB } = require('./config/db');

async function testLunch() {
  console.log('Connecting to database...');
  await connectDB();

  try {
    // 1. Find or create a student in LUNCH_PENDING state
    console.log('Finding or creating a student...');
    let student = await models.Student.findOne({ clearanceStatus: 'LUNCH_PENDING' });
    if (!student) {
      student = await models.Student.create({
        studentId: 'STU_LUNCH_TEST',
        admissionNumber: 'ADM_LUNCH_TEST',
        name: 'Lunch Test Student',
        gender: 'Male',
        dob: new Date('2012-05-15'),
        schoolType: 'ICSE',
        class: 'Class 9',
        section: 'A',
        rollNumber: '1',
        fatherName: 'Father',
        motherName: 'Mother',
        parentMobile: '9876543210',
        address: 'Address',
        academicYear: '2026-2027',
        clearanceStatus: 'LUNCH_PENDING',
        tuitionFee: { feeAmount: 15000, totalAmount: 15000, balanceAmount: 0, status: 'Paid' },
        bookFee: { feeAmount: 0, balanceAmount: 0, status: 'Paid' },
        uniformFee: { feeAmount: 0, balanceAmount: 0, status: 'Paid' },
        transportFee: { feeAmount: 0, balanceAmount: 0, status: 'Paid' },
        lunchFee: { feeAmount: 2500, balanceAmount: 2500, status: 'Pending' }
      });
    }

    // 2. Find or create a request in RequestQueue
    console.log('Finding or creating request queue item...');
    let request = await models.RequestQueue.findOne({ student: student._id });
    if (!request) {
      request = await models.RequestQueue.create({
        student: student._id,
        department: 'UNIFORM_DEPT',
        status: 'PENDING',
        remarks: 'Pending lunch clearance'
      });
    }

    // 3. Simulate POST payload
    const reqBody = {
      studentId: student._id.toString(),
      requestId: request._id.toString(),
      feeAmount: 2500,
      amountPaid: 2500,
      paymentMethod: 'Cash',
      lunchEnrollment: 'Lunch at School',
      lunchPeriod: 'Monthly'
    };

    console.log('Simulating POST payload:', reqBody);

    // Replicate controller body:
    const { 
      studentId, 
      requestId, 
      feeAmount, 
      amountPaid, 
      paymentMethod,
      lunchEnrollment,
      lunchPeriod
    } = reqBody;

    // Simulate route code
    const amtPaid = Number(amountPaid);
    const dbStudent = await models.Student.findById(studentId);
    
    dbStudent.lunchEnrollment = lunchEnrollment;
    dbStudent.lunchPeriod = lunchPeriod;
    
    let finalFee = Number(feeAmount);
    const lnConfig = await models.LunchConfig.findOne({ period: lunchPeriod });
    if (lnConfig) {
      finalFee = lnConfig.feeAmount || 0;
    }
    dbStudent.lunchFee.feeAmount = finalFee;
    dbStudent.lunchFee.amountPaid = Number(amountPaid);
    dbStudent.lunchFee.balanceAmount = 0;
    dbStudent.lunchFee.status = 'Paid';
    dbStudent.lunchFee.paymentDate = new Date();
    dbStudent.lunchFee.paymentMethod = paymentMethod;
    dbStudent.lunchFee.updatedBy = student._id; // mock userId

    dbStudent.clearanceStatus = 'COMPLETED';
    await dbStudent.save();

    console.log('SUCCESS: Saved student status.');

    // Resolve queue item
    await models.RequestQueue.findByIdAndUpdate(requestId, {
      status: 'APPROVED',
      actionedAt: new Date(),
      actionedBy: student._id,
      remarks: 'Uniform, transport, and lunch fees cleared.'
    });
    console.log('SUCCESS: Resolved request queue.');

    // Create payment transaction
    if (amtPaid > 0) {
      const pCount = await models.Payment.countDocuments();
      const receiptNumber = `REC${new Date().getFullYear()}${String(pCount + 1).padStart(6, '0')}`;
      
      const payment = await models.Payment.create({
        receiptNumber,
        student: studentId,
        feeType: 'Lunch',
        amount: amtPaid,
        paymentDate: new Date(),
        paymentMethod,
        transactionRef: '',
        staffName: 'Staff'
      });
      console.log('SUCCESS: Created payment receipt:', payment.receiptNumber);
    }

    // Cleanup
    await models.Student.deleteMany({ studentId: 'STU_LUNCH_TEST' });
    await models.RequestQueue.deleteMany({ student: student._id });

    console.log('TEST COMPLETED WITHOUT ERRORS!');

  } catch (error) {
    console.error('ERROR DETECTED during simulation:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

testLunch();
