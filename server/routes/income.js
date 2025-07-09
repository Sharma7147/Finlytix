const express = require('express');
const router = express.Router();
const Income = require('../models/Income');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const authenticateToken = require('../middleware/auth');

// @route   POST api/income
// @desc    Add new income
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { source, date, amount, paymentMethod, paymentStatus, notes, dueDate, receivedAmount } = req.body;

    // Basic validation
    if (!source || !amount || !paymentMethod || !paymentStatus) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const income = new Income({
      userId: req.user.id,
      source,
      date: date || new Date(),
      amount: parseFloat(amount),
      paymentMethod,
      paymentStatus,
      notes,
      dueDate: ['partial', 'pending'].includes(paymentStatus) ? new Date(dueDate) : null,
      receivedAmount: paymentStatus === 'partial' ? parseFloat(receivedAmount) : null
    });

    const savedIncome = await income.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json(savedIncome);

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error adding income:', err.message);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: Object.values(err.errors).map(e => e.message) 
      });
    }

    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET api/income
// @desc    Get all incomes for user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting parameters
    const sortBy = req.query.sortBy || '-date';
    const validSortFields = ['date', 'amount', 'source'];
    const sortField = sortBy.replace(/^-/, '');
    const sortOrder = sortBy.startsWith('-') ? -1 : 1;

    if (!validSortFields.includes(sortField)) {
      return res.status(400).json({ message: 'Invalid sort field' });
    }

    // Filtering parameters
    const filter = { userId: req.user.id };
    if (req.query.source) {
      filter.source = new RegExp(req.query.source, 'i');
    }
    if (req.query.paymentStatus) {
      filter.paymentStatus = req.query.paymentStatus;
    }
    if (req.query.fromDate) {
      filter.date = { ...filter.date, $gte: new Date(req.query.fromDate) };
    }
    if (req.query.toDate) {
      filter.date = { ...filter.date, $lte: new Date(req.query.toDate) };
    }

    const incomes = await Income.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Income.countDocuments(filter);

    res.json({
      data: incomes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });

  } catch (err) {
    console.error('Error fetching incomes:', err.message);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});


// @route   PATCH api/income/:id/update-payment
// @desc    Update payment status and received amount
// @access  Private
router.patch('/:id/update-payment', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentStatus, receivedAmount } = req.body;
    const incomeId = req.params.id;

    // Validate input
    if (!paymentStatus || (paymentStatus === 'partial' && !receivedAmount)) {
      return res.status(400).json({ message: 'Invalid payment data' });
    }

    const income = await Income.findOne({ _id: incomeId, userId: req.user.id }).session(session);
    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    // Validate payment update
    if (income.paymentStatus === 'received') {
      return res.status(400).json({ message: 'Payment already completed' });
    }

    // Update payment
    income.paymentStatus = paymentStatus;
    if (paymentStatus === 'partial') {
      income.receivedAmount = parseFloat(receivedAmount);
    } else if (paymentStatus === 'received') {
      income.receivedAmount = income.amount;
      income.dueDate = null;
    }

    const updatedIncome = await income.save({ session });

    // Here you could add additional logic like:
    // - Update user balance
    // - Create transaction record
    // - Send notification

    await session.commitTransaction();
    session.endSession();

    res.json(updatedIncome);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error updating payment:', err.message);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
// @route   GET api/income/:id
// @desc    Get single income record
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const income = await Income.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }

    res.json(income);
  } catch (err) {
    console.error('Error fetching income:', err.message);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
module.exports = router;