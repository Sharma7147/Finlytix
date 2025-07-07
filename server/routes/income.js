const express = require('express');
const router = express.Router();
const Income = require('../models/Income');
const auth = require('../middleware/auth');

// Add new income
router.post('/', auth, async (req, res) => {
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
      amount: Number(amount),
      paymentMethod,
      paymentStatus,
      notes,
      dueDate: ['partial', 'pending'].includes(paymentStatus) ? dueDate : null,
      receivedAmount: paymentStatus === 'partial' ? Number(receivedAmount) : null
    });

    const savedIncome = await income.save();
    res.status(201).json(savedIncome);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all incomes
router.get('/', auth, async (req, res) => {
  try {
    const incomes = await Income.find({ userId: req.user.id }).sort('-date');
    res.json(incomes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;