const mongoose = require('mongoose');

let isConnected = false;
global.dbMode = 'mongodb'; // Default to mongodb

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.log('--------------------------------------------------');
    console.log('WARNING: MONGODB_URI is not defined in .env file.');
    console.log('Running backend in MOCK (JSON file-based) mode.');
    console.log('--------------------------------------------------');
    global.dbMode = 'json';
    return;
  }

  try {
    mongoose.set('strictQuery', false);
    
    console.log(`Attempting to connect to MongoDB at ${process.env.MONGODB_URI}...`);
    // Connect with a short timeout so fallback triggers quickly if MongoDB is offline
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    
    isConnected = true;
    global.dbMode = 'mongodb';
    console.log('==================================================');
    console.log('SUCCESS: Successfully connected to MongoDB.');
    console.log('==================================================');
  } catch (error) {
    console.log('--------------------------------------------------');
    console.log(`MongoDB connection failed: ${error.message}`);
    if (process.env.DB_FALLBACK === 'true') {
      global.dbMode = 'json';
      console.log('FALLBACK: Falling back to local JSON database mode.');
      console.log('Data will be persisted in backend/data/*.json');
    } else {
      console.log('CRITICAL: Database fallback disabled. Exiting application.');
      process.exit(1);
    }
    console.log('--------------------------------------------------');
  }
};

module.exports = {
  connectDB,
  isConnected: () => isConnected,
  getDbMode: () => global.dbMode
};
