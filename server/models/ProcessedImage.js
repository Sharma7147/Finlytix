const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: String,
  category: String,
  quantity: Number,
  unitPrice: Number,
  amount: Number
});

const processedImageSchema = new mongoose.Schema({
  userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  fileName: String,
  vendor: String,
  date: Date,
  total: Number,
  items: [itemSchema],
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProcessedImage', processedImageSchema);
