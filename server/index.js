const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Allowed frontend origins (Dev & Production)
const allowedOrigins = [
  'http://localhost:5173', // Vite frontend in development
  'https://finlytix-y3gp.onrender.com', // Deployed frontend on Render
];

// ✅ CORS setup
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and auth headers
}));

// ✅ Middleware
app.use(express.json());
app.options('*', cors()); // Preflight requests

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Route Debug Logger (Optional)
const originalUse = app.use.bind(app);
app.use = function (path, ...handlers) {
  if (typeof path === 'string') {
    console.log('➡️  Registering route:', path);
  }
  return originalUse(path, ...handlers);
};

// ✅ Routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const expenseRoutes = require('./routes/expenses');
const incomeRoutes = require('./routes/income');

// ✅ Test Route
app.get('/', (req, res) => {
  res.send('Hello from backend!');
});

// ✅ API Routes
app.use('/api/auth', authRoutes);
app.use('/upload', uploadRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
