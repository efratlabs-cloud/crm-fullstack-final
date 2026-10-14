require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// חיבור ל-Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// נתיב בדיקה ראשוני
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRM Server is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});