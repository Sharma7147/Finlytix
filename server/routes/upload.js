const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const uuid = require('uuid').v4;
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ExpenseEntry = require('../models/ExpenseEntry'); // unified model
const auth = require('../middleware/auth'); // token middleware
const dotenv=require('dotenv');
dotenv.config();
// Gemini AI config
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Buffer → Base64
function bufferToBase64(buffer) {
  return buffer.toString('base64');
}

// Extract JSON from Gemini response
function extractJSON(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found");
    return JSON.parse(match[0]);
  } catch (err) {
    throw new Error("Invalid JSON format in Gemini response");
  }
}

router.post('/', auth, upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { temperature: 0.4 }
    });

    const promptText = `
You are an intelligent receipt analyzer.

Extract and return **only JSON** with the following structure:
{
  "vendor": "Vendor Name",
  "date": "YYYY-MM-DD",
  "total": 123.45,
  "items": [
    {
      "name": "Item name",
      "category": "Category (if available or guessable)",
      "quantity": 1,
      "unitPrice": 12.34,
      "amount": 12.34
    }
  ]
}

Rules:
- Return only the JSON, no markdown or extra notes.
- Try to infer categories if not clearly stated.
- Use number types for total and amount, no currency symbols.
`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inlineData: {
                mimeType: file.mimetype,
                data: bufferToBase64(file.buffer)
              }
            }
          ]
        }
      ]
    });

    const rawText = await result.response.text();
    console.log("Raw Gemini Response:", rawText);

    let jsonData;
    try {
      jsonData = extractJSON(rawText);
    } catch (parseErr) {
      return res.status(500).json({
        message: "Failed to parse JSON from Gemini response",
        rawResponse: rawText
      });
    }

    // Handle optional payment fields
    const paymentStatus = req.body.paymentStatus?.toLowerCase() || 'paid';
    const dueDate = paymentStatus === 'paid'
      ? null
      : (req.body.dueDate ? new Date(req.body.dueDate) : null);

    const paidAmount = (['paid', 'unpaid'].includes(paymentStatus))
      ? null
      : (req.body.paidAmount ? Number(req.body.paidAmount) : null);

      let payments = [];

if (paymentStatus !== 'unpaid') {
  try {
    payments = JSON.parse(req.body.payments);
    // Ensure recordedBy fallback
    payments = payments.map(p => ({
      amount: Number(p.amount),
      method: p.method,
      date: p.date ? new Date(p.date) : new Date(),
      recordedBy: p.recordedBy || req.user.id
    }));
  } catch (err) {
    console.warn("Failed to parse payments array:", req.body.payments);
  }
}


    console.log("Body:", req.body);
    console.log("paymentStatus:", paymentStatus);
    console.log("paidAmount:", paidAmount);
    console.log("dueDate:", dueDate);

    // Save expense
    const saved = await ExpenseEntry.create({
  userId: req.user.id,
  vendor: jsonData.vendor,
  date: new Date(jsonData.date),
  total: jsonData.total,
  items: jsonData.items,
  fileName: `${uuid()}${path.extname(file.originalname)}`,
  source: 'image',
  paymentStatus,
  dueDate,
  paidAmount,
  payments, 
  uploadedAt: new Date()
});


    res.status(200).json({
      message: 'Receipt processed and saved',
      data: saved
    });

  } catch (err) {
    console.error('Processing error:', err);
    res.status(500).json({ message: 'Image processing failed', error: err.message });
  }
});

module.exports = router;
