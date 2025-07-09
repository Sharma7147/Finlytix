
const express = require('express');
const router = express.Router();
const ExpenseEntry = require('../models/ExpenseEntry');
const authenticateToken = require('../middleware/auth');
const mongoose = require('mongoose');

// Util: Ensure ObjectId type
const getUserId = (id) => {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
};
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Return user object with standard structure
    return {
      id: decoded.userId || decoded.id,  // Common ID fields
      email: decoded.email,
      role: decoded.role,               // If you include roles in your token
      // Add any other user properties you store in the token
      ...decoded                        // Spread remaining token payload
    };
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return null;
  }
};
// Filter builder
const buildDateFilter = (userId, year, month) => {
  const filter = { userId };
  if (year && month) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    filter.date = { $gte: start, $lt: end };
  } else if (year) {
    const start = new Date(year, 0, 1);
    const end = new Date(Number(year) + 1, 0, 1);
    filter.date = { $gte: start, $lt: end };
  }
  return filter;
};


router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      vendor,
      date,
      total,
      items,
      source = 'manual',
      paymentStatus = 'paid',
      paymentMethod,
      dueDate,
      paidAmount,
      payments,
      isRecurring = false,
      recurrencePattern,
      nextRecurrenceDate,
      notes
    } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    if (!total || isNaN(total)) {
      return res.status(400).json({ message: 'Valid total amount is required' });
    }

    // Validate payment information
    if (paymentStatus !== 'unpaid' && !paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required for paid/partially paid expenses' });
    }

    if (paymentStatus === 'partially_paid' && (!paidAmount || isNaN(paidAmount))) {
      return res.status(400).json({ message: 'Valid paid amount is required for partially paid expenses' });
    }

    if (['partially_paid', 'unpaid'].includes(paymentStatus) && !dueDate) {
      return res.status(400).json({ message: 'Due date is required for unpaid/partially paid expenses' });
    }

    // Validate recurring expense fields if applicable
    if (isRecurring) {
      if (!recurrencePattern) {
        return res.status(400).json({ message: 'Recurrence pattern is required for recurring expenses' });
      }
      if (!nextRecurrenceDate) {
        return res.status(400).json({ message: 'Next recurrence date is required for recurring expenses' });
      }
    }

    // Calculate paid amount based on status
    const calculatedPaidAmount = paymentStatus === 'paid' 
      ? Number(total) 
      : paymentStatus === 'partially_paid' 
        ? Number(paidAmount) 
        : null;

    // Create payments array if not provided
    const paymentRecords = payments || (
      paymentStatus !== 'unpaid' 
        ? [{
            amount: calculatedPaidAmount,
            method: paymentMethod,
            date: new Date(),
            recordedBy: req.user.id
          }]
        : []
    );

    const expense = new ExpenseEntry({
      userId: req.user.id,
      vendor: vendor ? vendor.toLowerCase() : items[0].name.toLowerCase(),
      date: date ? new Date(date) : new Date(),
      total: Number(total),
      source,
      paymentStatus: paymentStatus.toLowerCase(),
      paymentMethod: paymentStatus !== 'unpaid' ? paymentMethod : undefined,
      dueDate: ['partially_paid', 'unpaid'].includes(paymentStatus) 
        ? new Date(dueDate) 
        : null,
      paidAmount: calculatedPaidAmount,
      payments: paymentRecords.map(p => ({
        amount: Number(p.amount),
        method: p.method,
        date: p.date ? new Date(p.date) : new Date(),
        recordedBy: p.recordedBy || req.user.id
      })),
      items: items.map(i => ({
        name: i.name.toLowerCase(),
        category: i.category || 'uncategorized',
        quantity: Number(i.quantity || 1),
        unitPrice: i.unitPrice ? Number(i.unitPrice) : Number(i.amount) / Number(i.quantity || 1),
        amount: Number(i.amount),
      })),
      isRecurring,
      recurrencePattern: isRecurring ? recurrencePattern : undefined,
      nextRecurrenceDate: isRecurring ? new Date(nextRecurrenceDate) : undefined,
      notes,
      uploadedAt: new Date()
    });

    const savedExpense = await expense.save();

    res.status(201).json({
      message: 'Expense added successfully',
      expense: savedExpense,
    });

  } catch (err) {
    console.error('Error adding expense:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


// --- Aggregated Reports ---

// 1. Item-wise breakdown
router.get('/analytics/items', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req.user.id);
    const { year, month } = req.query;
    const filter = buildDateFilter(userId, year, month);

    const result = await ExpenseEntry.aggregate([
      { $match: filter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalAmount: { $sum: '$items.amount' },
          totalQuantity: { $sum: '$items.quantity' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          items: {
            $push: {
              name: '$_id',
              amount: '$totalAmount',
              quantity: '$totalQuantity'
            }
          }
        }
      },
      { $unwind: '$items' },
      {
        $project: {
          _id: 0,
          name: '$items.name',
          totalAmount: '$items.amount',
          quantity: '$items.quantity',
          percentage: {
            $round: [{ $multiply: [{ $divide: ['$items.amount', '$total'] }, 100] }, 2]
          },
          totalAmountOverall: '$total'
        }
      }
    ]);

    res.json({ itemBreakdown: result });
  } catch (err) {
    console.error('Item breakdown error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. Vendor-wise breakdown
router.get('/analytics/vendors', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req.user.id);
    const { year, month } = req.query;
    const filter = buildDateFilter(userId, year, month);

    const result = await ExpenseEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$vendor',
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalSum: { $sum: '$total' },
          vendors: {
            $push: {
              vendor: '$_id',
              total: '$total',
              count: '$count'
            }
          }
        }
      },
      { $unwind: '$vendors' },
      {
        $project: {
          _id: 0,
          vendor: '$vendors.vendor',
          total: '$vendors.total',
          count: '$vendors.count',
          percentage: {
            $round: [
              { $multiply: [{ $divide: ['$vendors.total', '$totalSum'] }, 100] },
              2
            ]
          }
        }
      }
    ]);

    res.json({ vendorBreakdown: result });
  } catch (err) {
    console.error('Vendor breakdown error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. Monthly trend
router.get('/analytics/monthly', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req.user.id);
    const { year } = req.query;
    const filter = buildDateFilter(userId, year);

    const result = await ExpenseEntry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          total:`$total`
        }
      }
    ]);

    res.json({ monthlyTrend: result });
    
  } catch (err) {
    console.error('Monthly trend error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. Category-wise (if available in item)
router.get('/analytics/categories', authenticateToken, async (req, res) => {
  try {

    console.log("i am calling categories")
    const userId = getUserId(req.user.id);
    const { year, month } = req.query;
    const filter = buildDateFilter(userId, year, month);

    const result = await ExpenseEntry.aggregate([
      { $match: filter },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          total: { $sum: '$items.amount' }
        }
      },
      {
        $group: {
          _id: null,
          totalOverall: { $sum: '$total' },
          categories: {
            $push: {
              category: '$_id',
              total: '$total'
            }
          }
        }
      },
      { $unwind: '$categories' },
      {
        $project: {
          _id: 0,
          category: '$categories.category',
          total: '$categories.total',
          percentage: {
            $round: [
              { $multiply: [{ $divide: ['$categories.total', '$totalOverall'] }, 100] },
              2
            ]
          }
        }
      }
    ]);

    res.json({ categoryBreakdown: result });
    
  } catch (err) {
    console.error('Category breakdown error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET: All expenses flattened for table view
router.get('/analytics/table', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req.user.id);
    const { year, month } = req.query;

    const filter = buildDateFilter(userId, year, month);

    const entries = await ExpenseEntry.find(filter).sort({ date: -1 }).lean();

    const tableData = entries.flatMap(entry =>
      entry.items.map(item => ({
        id: entry._id.toString(),
        vendor: entry.vendor,
        date: entry.date.toISOString().split('T')[0],
        itemName: item.name,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        totalEntryAmount: entry.total,
        source: entry.source,
      }))
    );

    res.json({ expenses: tableData });
    
  } catch (err) {
    console.error('Error fetching table data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// GET: Unpaid or Partially_Paid Expenses
router.get('/unpaid-or-partial', authenticateToken, async (req, res) => {
  try {
    const { status, sort } = req.query;
    
    const query = {
      userId: req.user.id,
      paymentStatus: { $in: ['unpaid', 'partially_paid'] }
    };
    console.log(req.user.id)
    if (status && ['unpaid', 'partially_paid'].includes(status)) {
      query.paymentStatus = status;
    }
    
    let sortOption = { date: -1 }; // default sort
    if (sort === 'dueDate') sortOption = { dueDate: 1 };
    if (sort === 'amount') sortOption = { total: -1 };
    if (sort === 'vendor') sortOption = { vendor: 1 };
    
    const expenses = await ExpenseEntry.find(query).sort(sortOption);

    res.status(200).json({
      message: 'Fetched unpaid and partially paid expenses',
      expenses // changed from 'data' to 'expenses' to match frontend
    });

  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/all', authenticateToken, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const query = { userId: req.user.id };
console.log(query)
    if (status && status !== 'all') query.paymentStatus = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await ExpenseEntry.find(query )
  .sort({ date: -1 })
  .populate('items.category', 'name')
  .lean();


    res.json({ expenses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single expense
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
    }

    const expense = await ExpenseEntry.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('items.category', 'name');

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ expense });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
    }

    const expense = await ExpenseEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export expenses to CSV
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const expenses = await ExpenseEntry.find({ user: req.user._id })
      .sort({ date: -1 })
      .lean();

    const csvStringifier = csv({
      header: [
        { id: 'date', title: 'Date' },
        { id: 'vendor', title: 'Vendor' },
        { id: 'referenceNumber', title: 'Reference' },
        { id: 'total', title: 'Total Amount' },
        { id: 'paidAmount', title: 'Paid Amount' },
        { id: 'paymentStatus', title: 'Status' },
        { id: 'paymentMethod', title: 'Payment Method' },
        { id: 'source', title: 'Source' },
        { id: 'notes', title: 'Notes' }
      ]
    });

    const records = expenses.map(expense => ({
      date: new Date(expense.date).toISOString().split('T')[0],
      vendor: expense.vendor,
      referenceNumber: expense.referenceNumber || '',
      total: expense.total,
      paidAmount: expense.paidAmount,
      paymentStatus: expense.paymentStatus.replace('_', ' '),
      paymentMethod: expense.paymentMethod || '',
      source: expense.source,
      notes: expense.notes || ''
    }));

    const csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csvData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/pay', authenticateToken,async (req, res) => {
  try {
    const { expenseId, amount, paymentMethod, reference, notes, paymentDate } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token and get user
    // Assuming your verifyToken function attaches the user to req.user
    // You need to make sure this middleware runs before this route

    console.log(req.user)
    console.log(req.user.id)

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const userId = req.user.id; // Directly use req.user.id
  
    // Find the expense
    const expense = await ExpenseEntry.findOne({ 
      _id: expenseId,
      userId
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Convert amount to number
    const paymentAmount = parseFloat(amount);
    
    // Update payment status
    const newPaidAmount = (expense.paidAmount || 0) + paymentAmount;
    const newStatus = newPaidAmount >= expense.total ? 'paid' : 'partially_paid';

    // Create payment record
    const paymentRecord = {
      amount: paymentAmount,
      method: paymentMethod,
      reference,
      notes,
      date: paymentDate || new Date()
    };

    // Update the expense
    const updatedExpense = await ExpenseEntry.findByIdAndUpdate(
      expenseId,
      {
        $set: {
          paidAmount: newPaidAmount,
          paymentStatus: newStatus
        },
        $push: { payments: paymentRecord }
      },
      { new: true }
    );

    res.json({
      success: true,
      expense: updatedExpense
    });

  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Payment processing failed', error: error.message });
  }
});
module.exports = router;

