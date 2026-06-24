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
    await models.TransportConfig.deleteMany({});
    await models.LunchConfig.deleteMany({});
    await models.TuitionFee.deleteMany({});
    await models.BookFee.deleteMany({});
    await models.UniformFee.deleteMany({});
    await models.RequestQueue.deleteMany({});
    await models.Payment.deleteMany({});
    await models.Notification.deleteMany({});
    await models.AuditLog.deleteMany({});
    await models.Supplier.deleteMany({});
    await models.Inventory.deleteMany({});
    await models.PurchaseEntry.deleteMany({});
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
    const icseClasses = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

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
      class: 'Class 10',
      books: [...booksList, 'French Literature'],
      feeAmount: 4800
    });

    // ----------------------------------------------------
    // 5. SEED UNIFORM CONFIGURATIONS
    // ----------------------------------------------------
    console.log('Seeding uniform configurations...');
    const uniformItems = ['Shirt (Boys/Girls)', 'Pant/Skirt', 'Tie', 'Belt', 'Socks (Pack of 2)', 'Black Leather Shoes', 'Sports T-Shirt (House)', 'Sweater (Woolen)'];
    await models.UniformConfig.create({
      schoolType: 'CBSE',
      class: 'Class 10',
      items: uniformItems,
      feeAmount: 2800
    });
    await models.UniformConfig.create({
      schoolType: 'CBSE',
      class: 'Class 9',
      items: uniformItems,
      feeAmount: 2600
    });
    await models.UniformConfig.create({
      schoolType: 'ICSE',
      class: 'Class 10',
      items: [...uniformItems, 'Blazer (Navy Blue)'],
      feeAmount: 3500
    });
    console.log('Book and Uniform configurations seeded.');

    // ----------------------------------------------------
    // 6. SEED TRANSPORT CONFIGURATIONS
    // ----------------------------------------------------
    console.log('Seeding transportation configurations...');
    await models.TransportConfig.create({
      route: 'Route A',
      feeAmount: 3000,
      busNumber: 'BUS-A101'
    });
    await models.TransportConfig.create({
      route: 'Route B',
      feeAmount: 3500,
      busNumber: 'BUS-B202'
    });
    await models.TransportConfig.create({
      route: 'Route C',
      feeAmount: 4000,
      busNumber: 'BUS-C303'
    });

    // ----------------------------------------------------
    // 7. SEED LUNCH CONFIGURATIONS
    // ----------------------------------------------------
    console.log('Seeding lunch configurations...');
    await models.LunchConfig.create({
      period: 'Monthly',
      feeAmount: 2500
    });
    await models.LunchConfig.create({
      period: 'Quarterly',
      feeAmount: 7000
    });
    await models.LunchConfig.create({
      period: 'Annual',
      feeAmount: 25000
    });
    console.log('Transportation and Lunch configurations seeded.');

    // ----------------------------------------------------
    // 8. SEED SUPPLIERS, INVENTORY, AND PURCHASES
    // ----------------------------------------------------
    console.log('Seeding suppliers, inventory catalog, and purchase logs...');
    
    // Suppliers
    const supplierUniform = await models.Supplier.create({
      name: 'Vanguard Uniforms Ltd',
      phone: '+91 98765 11111',
      gstNumber: '29AAAAA1111A1Z1',
      address: 'Industrial Area Phase 2, Bangalore, Karnataka'
    });

    const supplierBooks = await models.Supplier.create({
      name: 'EduPress Learning Media',
      phone: '+91 98765 22222',
      gstNumber: '29BBBBB2222B2Z2',
      address: 'Educational Publishers Row, New Delhi'
    });

    console.log('Suppliers seeded.');

    // Uniform Inventory (size-wise)
    const sizes = ['28', '30', '32', '34', '36'];
    const uniformNames = ['Shirt (Boys/Girls)', 'Pant/Skirt', 'Sweater (Woolen)', 'Black Leather Shoes'];
    const classesList = ['Class 9', 'Class 10'];

    // Seed size-wise uniforms for CBSE & ICSE
    for (const uName of uniformNames) {
      for (const cls of classesList) {
        for (const size of sizes) {
          // Low stock simulation for some items to show low stock alerts
          const isLowStock = (size === '34' && uName === 'Shirt (Boys/Girls)' && cls === 'Class 10');
          const isOutOfStock = (size === '30' && uName === 'Sweater (Woolen)' && cls === 'Class 10');
          
          let qty = 45;
          if (isLowStock) qty = 4; // Below threshold of 10
          if (isOutOfStock) qty = 0;

          await models.Inventory.create({
            itemType: 'Uniform',
            name: uName,
            class: cls,
            size: size,
            quantity: qty,
            reorderThreshold: 10,
            unitCost: uName.includes('Shirt') ? 220 : uName.includes('Pant') ? 350 : uName.includes('Sweater') ? 600 : 400
          });
        }
      }
    }

    // Seed non-sized uniforms (like Tie, Belt, Socks) with general stock
    const staticUniforms = ['Tie', 'Belt', 'Socks (Pack of 2)'];
    for (const uName of staticUniforms) {
      await models.Inventory.create({
        itemType: 'Uniform',
        name: uName,
        class: 'Class 10',
        size: 'N/A',
        quantity: uName === 'Tie' ? 5 : 85, // Tie is low stock
        reorderThreshold: 10,
        unitCost: uName === 'Tie' ? 80 : uName === 'Belt' ? 120 : 70
      });
    }

    // Book Inventory (size N/A)
    const books = ['English Reader', 'Mathematics', 'General Science', 'Social Science', 'Computer Science'];
    for (const bName of books) {
      await models.Inventory.create({
        itemType: 'Book',
        name: bName,
        class: 'Class 10',
        size: 'N/A',
        quantity: bName === 'Computer Science' ? 3 : 110, // CS is low stock
        reorderThreshold: 10,
        unitCost: 280
      });
    }

    console.log('Inventory catalog seeded.');

    // Historical Purchases
    await models.PurchaseEntry.create({
      supplier: supplierUniform._id,
      invoiceNumber: 'INV/2026/0018',
      purchaseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      itemType: 'Uniform',
      itemName: 'Shirt (Boys/Girls)',
      size: '32',
      quantity: 100,
      cost: 22000
    });

    await models.PurchaseEntry.create({
      supplier: supplierBooks._id,
      invoiceNumber: 'INV/B/9903',
      purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      itemType: 'Book',
      itemName: 'Mathematics',
      size: 'N/A',
      quantity: 150,
      cost: 42000
    });

    console.log('Purchase history seeded.');

    console.log('==================================================');
    console.log('DATABASE SEEDING SUCCESSFUL (CORE CONFIGS & STAFF USERS ONLY)');
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
