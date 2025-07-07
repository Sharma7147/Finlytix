const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, required: true, enum: ['cash', 'card', 'bank_transfer', 'mobile_money', 'other'] },
  reference: { type: String },
  notes: { type: String },
  date: { type: Date, default: Date.now },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number },
  amount: { type: Number, required: true }
});

const expenseEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vendor: { 
    type: String, 
    lowercase: true,
    trim: true
  },
  fileName: { 
    type: String,
    trim: true
  },
  date: { 
    type: Date, 
    default: Date.now,
    required: true
  },
  total: { 
    type: Number, 
    required: true,
    min: 0
  },
  source: {
    type: String,
    enum: ['manual', 'image', 'import'],
    default: 'manual'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'partially_paid', 'unpaid'],
    default: 'unpaid'
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value >= this.date;
      },
      message: 'Due date must be after or equal to the expense date'
    }
  },
  paidAmount: { 
    type: Number, 
    default: 0,
    min: 0,
    validate: {
      validator: function(value) {
        return value <= this.total;
      },
      message: 'Paid amount cannot exceed total amount'
    }
  },
  items: [itemSchema],
  payments: [paymentSchema], // Array of payment records
  notes: { type: String, trim: true },
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: { type: String }, // e.g., 'monthly', 'weekly'
  nextRecurrenceDate: { type: Date },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Add index for better query performance
expenseEntrySchema.index({ userId: 1, date: -1 });
expenseEntrySchema.index({ userId: 1, paymentStatus: 1 });
expenseEntrySchema.index({ userId: 1, vendor: 1 });

module.exports = mongoose.model('ExpenseEntry', expenseEntrySchema);