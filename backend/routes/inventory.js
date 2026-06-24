const express = require('express');
const router = express.Router();
const models = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { logAudit } = require('../utils/helpers');

// Helper to check and save model (handles both Mongoose and JSON fallback modes)
async function saveDocument(doc, model) {
  if (typeof doc.save === 'function') {
    return await doc.save();
  } else {
    return await model.findByIdAndUpdate(doc._id, doc);
  }
}

// @route   GET /api/inventory/stats
// @desc    Get Inventory Dashboard statistics
// @access  Private
router.get('/stats', authenticate, async (req, res) => {
  try {
    const items = await models.Inventory.find({});
    
    let totalStock = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValue = 0;

    items.forEach(item => {
      const qty = Number(item.quantity) || 0;
      totalStock += qty;
      totalValue += qty * (Number(item.unitCost) || 0);

      if (qty === 0) {
        outOfStockCount++;
      } else if (qty <= (Number(item.reorderThreshold) || 10)) {
        lowStockCount++;
      }
    });

    // Compute recently issued count (sum of all issued books and uniforms)
    const students = await models.Student.find({});
    let recentlyIssued = 0;
    students.forEach(s => {
      if (s.uniformFee && s.uniformFee.issuedItems) {
        recentlyIssued += s.uniformFee.issuedItems.length;
      }
      if (s.bookFee && s.bookFee.issuedBooks) {
        recentlyIssued += s.bookFee.issuedBooks.length;
      }
    });

    // Compute total purchases count
    const purchases = await models.PurchaseEntry.find({});
    let recentlyPurchased = 0;
    purchases.forEach(p => {
      recentlyPurchased += Number(p.quantity) || 0;
    });

    res.json({
      totalStock,
      lowStockCount,
      outOfStockCount,
      recentlyIssued,
      recentlyPurchased,
      totalValue
    });
  } catch (error) {
    console.error('[ERROR] stats API failed:', error);
    res.status(500).json({ message: 'Server error compiling inventory stats' });
  }
});

// @route   GET /api/inventory/items
// @desc    Get Inventory list with search and filter
// @access  Private
router.get('/items', authenticate, async (req, res) => {
  try {
    const { search, itemType } = req.query;
    let query = {};
    if (itemType) {
      query.itemType = itemType;
    }

    const items = await models.Inventory.find(query);
    let filtered = items;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = items.filter(item => 
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.class && item.class.toLowerCase().includes(searchLower)) ||
        (item.size && item.size.toLowerCase().includes(searchLower)) ||
        (item.itemType && item.itemType.toLowerCase().includes(searchLower))
      );
    }

    res.json(filtered);
  } catch (error) {
    console.error('[ERROR] items GET failed:', error);
    res.status(500).json({ message: 'Server error fetching inventory items' });
  }
});

// @route   POST /api/inventory/items
// @desc    Configure a new inventory stock item
// @access  Private (Super Admin, Uniform Dept, Book Dept)
router.post('/items', authenticate, authorize(['SUPER_ADMIN', 'UNIFORM_DEPT', 'BOOK_DEPT']), async (req, res) => {
  const { itemType, name, class: className, size, quantity, reorderThreshold, unitCost } = req.body;
  
  if (!itemType || !name) {
    return res.status(400).json({ message: 'Item type and name are required' });
  }

  try {
    const existing = await models.Inventory.findOne({
      itemType,
      name,
      class: className || '',
      size: size || 'N/A'
    });

    if (existing) {
      return res.status(400).json({ message: 'Item with same name, class, and size already exists' });
    }

    const newItem = await models.Inventory.create({
      itemType,
      name,
      class: className || '',
      size: size || 'N/A',
      quantity: Number(quantity) || 0,
      reorderThreshold: Number(reorderThreshold) || 10,
      unitCost: Number(unitCost) || 0
    });

    await logAudit(
      req.user.username,
      'INVENTORY_ITEM_CREATED',
      null,
      `Created new inventory stock item: ${name} (${itemType})`
    );

    res.status(201).json(newItem);
  } catch (error) {
    console.error('[ERROR] items POST failed:', error);
    res.status(500).json({ message: 'Server error creating inventory item' });
  }
});

// @route   PUT /api/inventory/items/:id
// @desc    Update stock levels or thresholds manually
// @access  Private (Super Admin, Uniform Dept, Book Dept)
router.put('/items/:id', authenticate, authorize(['SUPER_ADMIN', 'UNIFORM_DEPT', 'BOOK_DEPT']), async (req, res) => {
  const { id } = req.params;
  const { quantity, reorderThreshold, unitCost, name, size, class: className } = req.body;

  try {
    const item = await models.Inventory.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    const oldItem = JSON.parse(JSON.stringify(item));
    const updateFields = {};
    if (quantity !== undefined) updateFields.quantity = Number(quantity);
    if (reorderThreshold !== undefined) updateFields.reorderThreshold = Number(reorderThreshold);
    if (unitCost !== undefined) updateFields.unitCost = Number(unitCost);
    if (name !== undefined) updateFields.name = name;
    if (size !== undefined) updateFields.size = size;
    if (className !== undefined) updateFields.class = className;

    const updated = await models.Inventory.findByIdAndUpdate(id, updateFields, { new: true });

    await logAudit(
      req.user.username,
      'INVENTORY_ITEM_UPDATED',
      null,
      `Updated inventory item: ${updated.name}. Qty: ${oldItem.quantity} -> ${updated.quantity}`,
      oldItem,
      updated
    );

    res.json(updated);
  } catch (error) {
    console.error('[ERROR] items PUT failed:', error);
    res.status(500).json({ message: 'Server error updating inventory item' });
  }
});

// @route   GET /api/inventory/suppliers
// @desc    Get suppliers directory
// @access  Private
router.get('/suppliers', authenticate, async (req, res) => {
  try {
    const suppliers = await models.Supplier.find({});
    res.json(suppliers);
  } catch (error) {
    console.error('[ERROR] suppliers GET failed:', error);
    res.status(500).json({ message: 'Server error fetching suppliers' });
  }
});

// @route   POST /api/inventory/suppliers
// @desc    Create supplier record
// @access  Private (Super Admin, Uniform Dept, Book Dept)
router.post('/suppliers', authenticate, authorize(['SUPER_ADMIN', 'UNIFORM_DEPT', 'BOOK_DEPT']), async (req, res) => {
  const { name, phone, gstNumber, address } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: 'Supplier name and phone are required' });
  }

  try {
    const newSupplier = await models.Supplier.create({
      name,
      phone,
      gstNumber: gstNumber || '',
      address: address || ''
    });

    await logAudit(
      req.user.username,
      'SUPPLIER_CREATED',
      null,
      `Created supplier: ${name}`
    );

    res.status(201).json(newSupplier);
  } catch (error) {
    console.error('[ERROR] suppliers POST failed:', error);
    res.status(500).json({ message: 'Server error creating supplier' });
  }
});

// @route   GET /api/inventory/purchases
// @desc    Get invoice list logs
// @access  Private
router.get('/purchases', authenticate, async (req, res) => {
  try {
    const purchases = await models.PurchaseEntry.find({});
    const suppliers = await models.Supplier.find({});
    
    // Manual mapping to bypass populate limitations on JSON database mode
    const mapped = purchases.map(p => {
      const raw = p.toObject ? p.toObject() : p;
      const supplierId = raw.supplier ? raw.supplier.toString() : '';
      const matchedSupplier = suppliers.find(s => s._id.toString() === supplierId);
      return {
        ...raw,
        supplier: matchedSupplier || { name: 'Unknown Supplier', phone: 'N/A' }
      };
    });

    // Sort by purchaseDate descending
    mapped.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

    res.json(mapped);
  } catch (error) {
    console.error('[ERROR] purchases GET failed:', error);
    res.status(500).json({ message: 'Server error fetching purchase entries' });
  }
});

// @route   POST /api/inventory/purchases
// @desc    Record inbound purchase and increment matching inventory stock
// @access  Private (Super Admin, Uniform Dept, Book Dept)
router.post('/purchases', authenticate, authorize(['SUPER_ADMIN', 'UNIFORM_DEPT', 'BOOK_DEPT']), async (req, res) => {
  const { supplierId, invoiceNumber, purchaseDate, itemType, itemName, size, quantity, cost } = req.body;

  if (!supplierId || !invoiceNumber || !itemType || !itemName || quantity === undefined || cost === undefined) {
    return res.status(400).json({ message: 'Missing required purchase entry fields' });
  }

  try {
    const supplier = await models.Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const qty = Number(quantity);
    const totalCost = Number(cost);
    const unitPrice = qty > 0 ? Number((totalCost / qty).toFixed(2)) : 0;

    // Create purchase entry log
    const purchase = await models.PurchaseEntry.create({
      supplier: supplierId,
      invoiceNumber,
      purchaseDate: purchaseDate || new Date(),
      itemType,
      itemName,
      size: size || 'N/A',
      quantity: qty,
      cost: totalCost
    });

    // Adjust/increment inventory stock levels
    let inventoryItem = await models.Inventory.findOne({
      itemType,
      name: itemName,
      size: size || 'N/A'
    });

    if (inventoryItem) {
      const newQty = (Number(inventoryItem.quantity) || 0) + qty;
      await models.Inventory.findByIdAndUpdate(inventoryItem._id, {
        quantity: newQty,
        unitCost: unitPrice
      });
    } else {
      // Auto-configure new item if not in stock
      await models.Inventory.create({
        itemType,
        name: itemName,
        class: '',
        size: size || 'N/A',
        quantity: qty,
        reorderThreshold: 10,
        unitCost: unitPrice
      });
    }

    await logAudit(
      req.user.username,
      'INVENTORY_PURCHASE_LOGGED',
      null,
      `Logged purchase invoice ${invoiceNumber} for ${itemName} (Qty: ${qty}, Cost: ₹${totalCost})`
    );

    res.status(201).json(purchase);
  } catch (error) {
    console.error('[ERROR] purchases POST failed:', error);
    res.status(500).json({ message: 'Server error recording purchase entry' });
  }
});

// @route   GET /api/inventory/issues
// @desc    Retrieve timeline log of distributed stock to students
// @access  Private
router.get('/issues', authenticate, async (req, res) => {
  try {
    const students = await models.Student.find({});
    const issues = [];

    students.forEach(student => {
      if (student.uniformFee && student.uniformFee.issuedItems && student.uniformFee.issuedItems.length > 0) {
        student.uniformFee.issuedItems.forEach(item => {
          issues.push({
            studentName: student.name,
            studentId: student.studentId,
            class: student.class,
            section: student.section,
            itemType: 'Uniform',
            itemName: item,
            date: student.uniformFee.paymentDate || student.updatedAt || student.createdAt,
            status: 'Issued'
          });
        });
      }
      if (student.bookFee && student.bookFee.issuedBooks && student.bookFee.issuedBooks.length > 0) {
        student.bookFee.issuedBooks.forEach(book => {
          issues.push({
            studentName: student.name,
            studentId: student.studentId,
            class: student.class,
            section: student.section,
            itemType: 'Book',
            itemName: book,
            date: student.bookFee.paymentDate || student.updatedAt || student.createdAt,
            status: 'Issued'
          });
        });
      }
    });

    // Sort by date descending
    issues.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(issues);
  } catch (error) {
    console.error('[ERROR] issues GET failed:', error);
    res.status(500).json({ message: 'Server error compiling student issue logs' });
  }
});

// @route   GET /api/inventory/forecast
// @desc    AI Simulation predicting stock run-out cycles based on student enrollment
// @access  Private
router.get('/forecast', authenticate, async (req, res) => {
  try {
    const inventory = await models.Inventory.find({});
    const students = await models.Student.find({});

    const forecasts = [];

    for (const item of inventory) {
      let pendingDemand = 0;

      if (item.itemType === 'Book') {
        // Books of matching class that haven't been distributed yet
        pendingDemand = students.filter(s => 
          s.class === item.class && 
          ['TUITION_PENDING', 'TUITION_CLEARED', 'BOOKS_PENDING'].includes(s.clearanceStatus)
        ).length;
      } else if (item.itemType === 'Uniform') {
        // Uniforms of matching class (or general school-wide if item has no class configuration)
        pendingDemand = students.filter(s => {
          const classMatches = item.class ? s.class === item.class : true;
          const needsUniform = ['TUITION_PENDING', 'TUITION_CLEARED', 'BOOKS_PENDING', 'BOOKS_CLEARED', 'UNIFORM_PENDING'].includes(s.clearanceStatus);
          return classMatches && needsUniform;
        }).length;
      }

      const qty = Number(item.quantity) || 0;
      const shortage = Math.max(0, pendingDemand - qty);
      
      let status = 'Adequate';
      let daysToRunOut = 'N/A';

      if (shortage > 0) {
        status = qty === 0 ? 'Out of Stock' : 'Shortage Risk';
        // Assume average distribution rate of 3 students per day
        daysToRunOut = qty === 0 ? 0 : Math.round(qty / 3);
      } else if (qty <= (Number(item.reorderThreshold) || 10)) {
        status = 'Low Stock';
        daysToRunOut = Math.round(qty / 2) || 1;
      }

      forecasts.push({
        _id: item._id,
        name: item.name,
        itemType: item.itemType,
        class: item.class || 'General / All',
        size: item.size || 'N/A',
        quantity: qty,
        reorderThreshold: Number(item.reorderThreshold) || 10,
        pendingDemand,
        shortage,
        status,
        daysToRunOut
      });
    }

    // Sort by status risk
    const statusPriority = { 'Out of Stock': 4, 'Shortage Risk': 3, 'Low Stock': 2, 'Adequate': 1 };
    forecasts.sort((a, b) => (statusPriority[b.status] || 0) - (statusPriority[a.status] || 0));

    res.json(forecasts);
  } catch (error) {
    console.error('[ERROR] forecast GET failed:', error);
    res.status(500).json({ message: 'Server error computing inventory forecasts' });
  }
});

module.exports = router;
