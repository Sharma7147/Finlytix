const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  notes: { type: String },
  dueDate: { type: Date },
  receivedAmount: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Income', IncomeSchema);
