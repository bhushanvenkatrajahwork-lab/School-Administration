const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('../config/db');
const models = require('../models');

dotenv.config();

async function verify() {
  console.log('Connecting to database...');
  await connectDB();

  try {
    console.log('\n--- Checking Student Fee Subdocuments ---');
    const students = await models.Student.find({});
    console.log(`Total students found: ${students.length}`);
    
    for (const student of students) {
      console.log(`\nStudent: ${student.name} (${student.studentId})`);
      console.log(`- Clearance Status: ${student.clearanceStatus}`);
      console.log(`- Tuition Fee Nested:`, JSON.stringify(student.tuitionFee, null, 2));
      console.log(`- Book Fee Nested:`, JSON.stringify(student.bookFee, null, 2));
      console.log(`- Uniform Fee Nested:`, JSON.stringify(student.uniformFee, null, 2));
      console.log(`- Transport Fee Nested:`, JSON.stringify(student.transportFee, null, 2));
      console.log(`- Lunch Fee Nested:`, JSON.stringify(student.lunchFee, null, 2));
    }
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

verify();
