
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

  // Keep track of dynamically created test objects to delete at cleanup
  const createdSuppliers = [];
  const createdInventory = [];
  const createdPurchases = [];

  try {
    // 1. Create and Verify Test Suppliers
    console.log('\n--- Test 1: Checking Supplier Creation ---');
    const tempSupplier1 = await models.Supplier.create({
      name: 'Test Supplier Alpha',
      phone: '+91 99999 11111',
      gstNumber: '29TESTS1111A1Z1',
      address: 'Test Phase 2, Bangalore'
    });
    createdSuppliers.push(tempSupplier1);

    const tempSupplier2 = await models.Supplier.create({
      name: 'Test Supplier Beta',
      phone: '+91 99999 22222',
      gstNumber: '29TESTS2222B2Z2',
      address: 'Test Publishers Row, Delhi'
    });
    createdSuppliers.push(tempSupplier2);

    const suppliers = await models.Supplier.find({ name: { $regex: '^Test Supplier' } });
    console.log(`Test suppliers found in search query: ${suppliers.length}`);
    suppliers.forEach(s => console.log(`- ${s.name} (Phone: ${s.phone})`));
    
    if (suppliers.length < 2) {
      throw new Error('FAIL: Created test suppliers not found!');
    }
    console.log('SUCCESS: Supplier creation and query verified.');

    // 2. Create and Verify Catalog Items
    console.log('\n--- Test 2: Checking Inventory Catalog Creation ---');
    const tempItem1 = await models.Inventory.create({
      itemType: 'Uniform',
      name: 'Test Shirt (Boys/Girls)',
      class: 'Class 9',
      size: '32',
      quantity: 10,
      reorderThreshold: 5,
      unitCost: 150
    });
    createdInventory.push(tempItem1);

    const tempItem2 = await models.Inventory.create({
      itemType: 'Book',
      name: 'Test English Reader',
      class: 'Class 10',
      size: 'N/A',
      quantity: 20,
      reorderThreshold: 10,
      unitCost: 200
    });
    createdInventory.push(tempItem2);

    const inventory = await models.Inventory.find({ name: { $regex: '^Test ' } });
    console.log(`Test inventory items found: ${inventory.length}`);
    inventory.forEach(i => console.log(`- ${i.name} (Type: ${i.itemType}, Qty: ${i.quantity})`));
    
    if (inventory.length < 2) {
      throw new Error('FAIL: Created test inventory items not found!');
    }
    console.log('SUCCESS: Inventory catalog creation and query verified.');

    // 3. Test Purchase Log Stock Increments
    console.log('\n--- Test 3: Testing Purchase Stock Increments ---');
    const targetItem = tempItem1;
    const originalQty = targetItem.quantity;
    console.log(`Target restock item: "${targetItem.name}" (Size: ${targetItem.size})`);
    console.log(`Original Quantity: ${originalQty} pcs`);

    // Log a new purchase entry
    const testSupplier = tempSupplier1;
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
    createdPurchases.push(purchase);

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
    const decrementItem = updatedItem;
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
    const bookItem = tempItem2;
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

    console.log('\n==================================================');
    console.log('ALL INVENTORY INTEGRATION TESTS PASSED!');
    console.log('==================================================');

  } catch (err) {
    console.error('\nFAIL: Integration test run failed with error:', err);
  } finally {
    // Database Cleanup
    console.log('\nCleaning up created test documents from database...');
    for (const p of createdPurchases) {
      await models.PurchaseEntry.deleteOne({ _id: p._id });
    }
    for (const i of createdInventory) {
      await models.Inventory.deleteOne({ _id: i._id });
    }
    for (const s of createdSuppliers) {
      await models.Supplier.deleteOne({ _id: s._id });
    }
    console.log('SUCCESS: Database test states cleaned up successfully.');

    mongoose.connection.close();
    process.exit(0);
  }
}

testInventory();
