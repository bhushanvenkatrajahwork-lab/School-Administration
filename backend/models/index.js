const mongoose = require('mongoose');
const { JSONModel } = require('../config/jsonDb');

// Helper to determine if we are in Mock/JSON mode
function isMockMode() {
  return global.dbMode === 'json';
}

// ==========================================
// 1. USER SCHEMA
// ==========================================
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['SUPER_ADMIN', 'TUITION_DEPT', 'BOOK_DEPT', 'UNIFORM_DEPT'] 
  },
  name: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true, collection: 'auth.users' });

const nestedTuitionFeeSchema = new mongoose.Schema({
  feeAmount: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  fine: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  status: { type: String, default: 'Pending', enum: ['Paid', 'Partial', 'Pending'] },
  paymentDate: { type: Date },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'NetBanking'] },
  transactionRef: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const nestedBookFeeSchema = new mongoose.Schema({
  feeAmount: { type: Number, required: true, default: 0 },
  amountPaid: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  status: { type: String, default: 'Pending', enum: ['Paid', 'Partial', 'Pending'] },
  issuedBooks: [{ type: String }],
  paymentMethod: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const nestedUniformFeeSchema = new mongoose.Schema({
  feeAmount: { type: Number, required: true, default: 0 },
  amountPaid: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  status: { type: String, default: 'Pending', enum: ['Paid', 'Partial', 'Pending'] },
  issuedItems: [{ type: String }],
  paymentMethod: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

// ==========================================
// 2. STUDENT SCHEMA
// ==========================================
const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true }, // Auto generated (STUXXXXXX)
  admissionNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  dob: { type: Date, required: true },
  schoolType: { type: String, required: true, enum: ['CBSE', 'ICSE'] },
  class: { type: String, required: true },
  section: { type: String, required: true },
  rollNumber: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  parentMobile: { type: String, required: true },
  email: { type: String },
  address: { type: String, required: true },
  academicYear: { type: String, required: true },
  clearanceStatus: { 
    type: String, 
    default: 'TUITION_PENDING',
    enum: [
      'TUITION_PENDING', 
      'TUITION_CLEARED', 
      'BOOKS_PENDING', 
      'BOOKS_CLEARED', 
      'UNIFORM_PENDING', 
      'UNIFORM_CLEARED', 
      'COMPLETED'
    ] 
  },
  tuitionFee: { type: nestedTuitionFeeSchema, default: () => ({}) },
  bookFee: { type: nestedBookFeeSchema, default: () => ({}) },
  uniformFee: { type: nestedUniformFeeSchema, default: () => ({}) }
}, { timestamps: true, collection: 'student.records' });

// ==========================================
// 3. CLASS CONFIG SCHEMA
// ==========================================
const classConfigSchema = new mongoose.Schema({
  schoolType: { type: String, required: true, enum: ['CBSE', 'ICSE'] },
  name: { type: String, required: true }, // e.g., "Class 1"
  sections: [{ type: String }] // e.g., ["A", "B", "C"]
}, { timestamps: true, collection: 'config.classes' });

// ==========================================
// 4. BOOK CONFIG SCHEMA
// ==========================================
const bookConfigSchema = new mongoose.Schema({
  schoolType: { type: String, required: true },
  class: { type: String, required: true },
  books: [{ type: String }],
  feeAmount: { type: Number, required: true, default: 0 }
}, { timestamps: true, collection: 'config.books' });

// ==========================================
// 5. UNIFORM CONFIG SCHEMA
// ==========================================
const uniformConfigSchema = new mongoose.Schema({
  class: { type: String, required: true },
  items: [{ type: String }],
  feeAmount: { type: Number, required: true, default: 0 }
}, { timestamps: true, collection: 'config.uniforms' });

// ==========================================
// 6. TUITION FEE SCHEMA
// ==========================================
const tuitionFeeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeAmount: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  fine: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  status: { type: String, default: 'Pending', enum: ['Paid', 'Partial', 'Pending'] },
  paymentDate: { type: Date },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'NetBanking'] },
  transactionRef: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, collection: 'fee.tuition' });

// ==========================================
// 7. BOOK FEE SCHEMA
// ==========================================
const bookFeeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeAmount: { type: Number, required: true, default: 0 },
  amountPaid: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  status: { type: String, default: 'Pending', enum: ['Paid', 'Partial', 'Pending'] },
  issuedBooks: [{ type: String }],
  paymentMethod: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, collection: 'fee.book' });

// ==========================================
// 8. UNIFORM FEE SCHEMA
// ==========================================
const uniformFeeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeAmount: { type: Number, required: true, default: 0 },
  amountPaid: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  status: { type: String, default: 'Pending', enum: ['Paid', 'Partial', 'Pending'] },
  issuedItems: [{ type: String }],
  paymentMethod: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, collection: 'fee.uniform' });

// ==========================================
// 9. REQUEST QUEUE SCHEMA
// ==========================================
const requestQueueSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  department: { type: String, required: true, enum: ['BOOK_DEPT', 'UNIFORM_DEPT'] },
  status: { type: String, default: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
  remarks: { type: String },
  actionedAt: { type: Date },
  actionedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, collection: 'workflow.requests' });

// ==========================================
// 10. AUDIT LOG SCHEMA
// ==========================================
const auditLogSchema = new mongoose.Schema({
  user: { type: String, required: true }, // Username or "SYSTEM"
  action: { type: String, required: true }, // e.g. "STUDENT_CREATED", "TUITION_PAID"
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  details: { type: String, required: true },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true, collection: 'logs.audit' });

// ==========================================
// 11. NOTIFICATION SCHEMA
// ==========================================
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  roles: [{ type: String }], // Array of roles that should see this, e.g. ['SUPER_ADMIN', 'BOOK_DEPT']
  readBy: [{ type: String }] // Array of userIds who marked this as read
}, { timestamps: true, collection: 'sys.notifications' });

// ==========================================
// 12. PAYMENT (TRANSACTION HISTORY) SCHEMA
// ==========================================
const paymentSchema = new mongoose.Schema({
  receiptNumber: { type: String, required: true, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeType: { type: String, required: true, enum: ['Tuition', 'Book', 'Uniform'] },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, required: true },
  transactionRef: { type: String },
  staffName: { type: String, required: true }
}, { timestamps: true, collection: 'finance.payments' });


// Compile Mongoose models dynamically so they can be exported
// We compile them anyway, but only use them if MongoDB is selected
let MongooseModels = {};
try {
  MongooseModels = {
    User: mongoose.model('User', userSchema),
    Student: mongoose.model('Student', studentSchema),
    ClassConfig: mongoose.model('ClassConfig', classConfigSchema),
    BookConfig: mongoose.model('BookConfig', bookConfigSchema),
    UniformConfig: mongoose.model('UniformConfig', uniformConfigSchema),
    TuitionFee: mongoose.model('TuitionFee', tuitionFeeSchema),
    BookFee: mongoose.model('BookFee', bookFeeSchema),
    UniformFee: mongoose.model('UniformFee', uniformFeeSchema),
    RequestQueue: mongoose.model('RequestQueue', requestQueueSchema),
    AuditLog: mongoose.model('AuditLog', auditLogSchema),
    Notification: mongoose.model('Notification', notificationSchema),
    Payment: mongoose.model('Payment', paymentSchema)
  };
} catch (e) {
  // Catch overwrite errors if compile is run multiple times
}

// JSON Fallback Models
const JSONModels = {
  User: new JSONModel('auth.users'),
  Student: new JSONModel('student.records'),
  ClassConfig: new JSONModel('config.classes'),
  BookConfig: new JSONModel('config.books'),
  UniformConfig: new JSONModel('config.uniforms'),
  TuitionFee: new JSONModel('fee.tuition'),
  BookFee: new JSONModel('fee.book'),
  UniformFee: new JSONModel('fee.uniform'),
  RequestQueue: new JSONModel('workflow.requests'),
  AuditLog: new JSONModel('logs.audit'),
  Notification: new JSONModel('sys.notifications'),
  Payment: new JSONModel('finance.payments')
};

// Export dynamic proxy that points to either Mongo or JSON Model based on mock mode setting
const modelsProxy = {};
Object.keys(JSONModels).forEach(modelName => {
  Object.defineProperty(modelsProxy, modelName, {
    get: function() {
      if (isMockMode()) {
        return JSONModels[modelName];
      }
      return MongooseModels[modelName];
    }
  });
});

module.exports = modelsProxy;
