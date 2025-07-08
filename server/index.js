const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth'); // import route
const dotenv=require('dotenv');
dotenv.config();
const uploadRoutes = require('./routes/upload');
const app = express();
const PORT = 5000;
const allowedOrigins = ['https://finlytix-y3gp.onrender.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


// Middleware
app.options('*', cors());
app.use(express.json());
app.use('/upload', uploadRoutes);


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('Hello from backend!');
});



// Use Auth Routes
app.use('/api/auth', authRoutes); // all auth routes prefixed with /api/auth
const expenseRoutes = require('./routes/expenses');
app.use('/api/expenses', expenseRoutes);

const incomeRoutes = require('./routes/income');
app.use('/income', incomeRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
