// validations/income.js
const { body, validationResult } = require('express-validator');

exports.validateIncome = [
  body('source').trim().notEmpty().withMessage('Income source is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').isIn(['cash', 'bank_transfer', 'card', 'check', 'mobile_money', 'crypto', 'other']),
  body('paymentStatus').isIn(['received', 'partial', 'pending']),
  body('receivedAmount').custom((value, { req }) => {
    if (req.body.paymentStatus === 'partial') {
      if (!value) throw new Error('Received amount is required for partial payments');
      if (parseFloat(value) >= parseFloat(req.body.amount)) {
        throw new Error('Received amount must be less than total amount');
      }
    }
    return true;
  }),
  body('dueDate').custom((value, { req }) => {
    if (['partial', 'pending'].includes(req.body.paymentStatus) {
      if (!value) throw new Error('Due date is required for pending/partial payments');
      if (new Date(value) < new Date(req.body.date || new Date())) {
        throw new Error('Due date must be in the future');
      }
    }
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];