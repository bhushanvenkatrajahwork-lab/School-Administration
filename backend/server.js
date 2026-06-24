const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Set up middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const studentRoutes = require('./routes/students');
const tuitionRoutes = require('./routes/feesTuition');
const bookRoutes = require('./routes/feesBooks');
const uniformRoutes = require('./routes/feesUniforms');
const transportationRoutes = require('./routes/feesTransportation');
const lunchRoutes = require('./routes/feesLunch');
const reportsRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const auditRoutes = require('./routes/audit');
const notificationRoutes = require('./routes/notifications');
const inventoryRoutes = require('./routes/inventory');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees/tuition', tuitionRoutes);
app.use('/api/fees/books', bookRoutes);
app.use('/api/fees/uniforms', uniformRoutes);
app.use('/api/fees/transportation', transportationRoutes);
app.use('/api/fees/lunch', lunchRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/inventory', inventoryRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'School Administration & Fee Clearance API running successfully.' });
});

// Boot Database & Start Server
const PORT = process.env.PORT || 5000;

async function bootstrap() {
  // Try connecting to MongoDB. On failure, this sets global.dbMode = 'json'
  await connectDB();

  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`Server is running on port ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}`);
    console.log(`Mode: ${global.dbMode === 'json' ? 'MOCK DATABASE (File-based)' : 'REAL MONGODB'}`);
    console.log(`==================================================`);
  });
}

bootstrap();
// Trigger nodemon restart to reload environment configurations

