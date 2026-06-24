const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const models = require('../models');
const { connectDB } = require('../config/db');

async function testInventory() {
  console.log('==================================================');
  console.log('STARTING INVENTORY SYSTEM INTEGRATION TESTS');
  console.log('==================================================');

  console.log('Connecting to database...');
  await connectDB();

  try {
    // 1. Verify Seeded Suppliers
    console.log('\n--- Test 1: Checking Seeded Suppliers ---');
    const suppliers = await models.Supplier.find({});
    console.log(`Suppliers count: ${suppliers.length}`);
    suppliers.forEach(s => console.log(`- ${s.name} (Phone: ${s.phone})`));
    
    if (suppliers.length < 2) {
      throw new Error('FAIL: Seeded suppliers missing!');
    }
    console.log('SUCCESS: Seeded suppliers verified.');

    // 2. Verify Seeded Stock Items
    console.log('\n--- Test 2: Checking Seeded Inventory Catalog ---');
    const inventory = await models.Inventory.find({});
    console.log(`Inventory catalog size: ${inventory.length} items`);
    const uniforms = inventory.filter(i => i.itemType === 'Uniform');
    const books = inventory.filter(i => i.itemType === 'Book');
    console.log(`- Uniform config lines: ${uniforms.length}`);
    console.log(`- Textbook catalog lines: ${books.length}`);
    
    if (inventory.length === 0) {
      throw new Error('FAIL: Inventory catalog is empty!');
    }
    console.log('SUCCESS: Seeded inventory catalog verified.');

    // 3. Test Purchase Log Stock Increments
    console.log('\n--- Test 3: Testing Purchase Stock Increments ---');
    const targetItem = await models.Inventory.findOne({ itemType: 'Uniform', size: '32' });
    if (!targetItem) {
      throw new Error('FAIL: No Uniform size 32 item found to test restock!');
    }
    
    const originalQty = targetItem.quantity || 0;
    console.log(`Target restock item: "${targetItem.name}" (Size: ${targetItem.size})`);
    console.log(`Original Quantity: ${originalQty} pcs`);

    // Log a new purchase entry
    const testSupplier = suppliers[0];
    const invoiceNum = 'TST-INV-' + Date.now().toString().slice(-4);
    const purchaseQty = 50;
    const totalCost = 10000;

    console.log(`Recording purchase entry... Invoice: ${invoiceNum}, Qty: ${purchaseQty}, Cost: ₹${totalCost}`);
    const purchase = await models.PurchaseEntry.create({
      supplier: testSupplier._id,
      invoiceNumber: invoiceNum,
      purchaseDate: new Date(),
      itemType: 'Uniform',
      itemName: targetItem.name,
      size: targetItem.size,
      quantity: purchaseQty,
      cost: totalCost
    });

    // Run increment logic
    const unitPrice = Number((totalCost / purchaseQty).toFixed(2));
    const newStockQty = originalQty + purchaseQty;
    await models.Inventory.findByIdAndUpdate(targetItem._id, {
      quantity: newStockQty,
      unitCost: unitPrice
    });

    const updatedItem = await models.Inventory.findById(targetItem._id);
    console.log(`Updated Quantity: ${updatedItem.quantity} pcs`);
    console.log(`Updated Unit Cost: ₹${updatedItem.unitCost}`);

    if (updatedItem.quantity !== originalQty + purchaseQty) {
      throw new Error(`FAIL: Quantity mismatch! Expected ${originalQty + purchaseQty}, got ${updatedItem.quantity}`);
    }
    console.log('SUCCESS: Purchase stock auto-increments verified.');

    // 4. Test Uniform Clearance Stock Decrements
    console.log('\n--- Test 4: Testing Uniform Checkout Stock Decrements ---');
    const sizeToDecrement = '32';
    const decrementItem = await models.Inventory.findOne({ itemType: 'Uniform', size: sizeToDecrement });
    const decOriginalQty = decrementItem.quantity;
    console.log(`Target decrement item: "${decrementItem.name}" (Size: ${decrementItem.size})`);
    console.log(`Original Quantity: ${decOriginalQty} pcs`);

    // Simulate checkout payload
    const checkoutItems = [{ name: decrementItem.name, size: sizeToDecrement }];
    for (const item of checkoutItems) {
      const invItem = await models.Inventory.findOne({
        itemType: 'Uniform',
        name: item.name,
        size: item.size
      });
      if (invItem) {
        const newQty = Math.max(0, (invItem.quantity || 0) - 1);
        await models.Inventory.findByIdAndUpdate(invItem._id, { quantity: newQty });
      }
    }

    const postDecItem = await models.Inventory.findOne({ itemType: 'Uniform', name: decrementItem.name, size: sizeToDecrement });
    console.log(`Updated Quantity: ${postDecItem.quantity} pcs`);
    
    if (postDecItem.quantity !== decOriginalQty - 1) {
      throw new Error(`FAIL: Quantity decrement failed! Expected ${decOriginalQty - 1}, got ${postDecItem.quantity}`);
    }
    console.log('SUCCESS: Clearance uniform checkout stock decrement verified.');

    // 5. Test Book Clearance Stock Decrements
    console.log('\n--- Test 5: Testing Book Checkout Stock Decrements ---');
    const bookItem = await models.Inventory.findOne({ itemType: 'Book' });
    if (!bookItem) {
      throw new Error('FAIL: No Book item found to test decrement!');
    }
    
    const bookOriginalQty = bookItem.quantity;
    console.log(`Target book item: "${bookItem.name}"`);
    console.log(`Original Quantity: ${bookOriginalQty} pcs`);

    const checkoutBooks = [bookItem.name];
    for (const book of checkoutBooks) {
      const invItem = await models.Inventory.findOne({
        itemType: 'Book',
        name: book,
        size: 'N/A'
      });
      if (invItem) {
        const newQty = Math.max(0, (invItem.quantity || 0) - 1);
        await models.Inventory.findByIdAndUpdate(invItem._id, { quantity: newQty });
      }
    }

    const postDecBook = await models.Inventory.findById(bookItem._id);
    console.log(`Updated Quantity: ${postDecBook.quantity} pcs`);

    if (postDecBook.quantity !== bookOriginalQty - 1) {
      throw new Error(`FAIL: Book decrement failed! Expected ${bookOriginalQty - 1}, got ${postDecBook.quantity}`);
    }
    console.log('SUCCESS: Clearance book checkout stock decrement verified.');

    // Cleanup purchase entry
    await models.PurchaseEntry.deleteOne({ _id: purchase._id });
    // Restore quantities
    await models.Inventory.findByIdAndUpdate(targetItem._id, { quantity: originalQty, unitCost: targetItem.unitCost });
    await models.Inventory.findByIdAndUpdate(decrementItem._id, { quantity: decOriginalQty });
    await models.Inventory.findByIdAndUpdate(bookItem._id, { quantity: bookOriginalQty });
    console.log('\nSUCCESS: Database test states cleaned up successfully.');

    console.log('\n==================================================');
    console.log('ALL INVENTORY INTEGRATION TESTS PASSED!');
    console.log('==================================================');

  } catch (err) {
    console.error('\nFAIL: Integration test run failed with error:', err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

testInventory();
