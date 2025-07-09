const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  source: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  date: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0.01,
    set: v => parseFloat(v.toFixed(2))
  },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['cash', 'bank_transfer', 'card', 'mobile_money', 'other'],
    default: 'cash'
  },
  paymentStatus: { 
    type: String, 
    required: true,
    enum: ['received', 'partial', 'pending'],
    default: 'received'
  },
  notes: { 
    type: String,
    trim: true,
    maxlength: 500
  },
  dueDate: { 
    type: Date
  },
  receivedAmount: { 
    type: Number,
    set: v => v ? parseFloat(v.toFixed(2)) : v
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
IncomeSchema.index({ userId: 1, date: -1 });
IncomeSchema.index({ userId: 1, paymentStatus: 1 });
IncomeSchema.index({ userId: 1, source: 1 });

// Virtual field for remaining amount
IncomeSchema.virtual('remainingAmount').get(function() {
  if (this.paymentStatus === 'partial') {
    return parseFloat((this.amount - this.receivedAmount).toFixed(2));
  }
  return this.paymentStatus === 'pending' ? this.amount : 0;
});

module.exports = mongoose.model('Income', IncomeSchema);