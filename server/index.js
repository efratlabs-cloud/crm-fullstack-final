require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// חיבור ל-Database
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const leadRoutes = require("./routes/leadRoutes");
const projectRoutes = require("./routes/projectRoutes");
const aiRoutes = require("./routes/aiRoutes");

// הגדרת הנתיבים
app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/ai", aiRoutes);

// נתיב בדיקה ראשוני
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CRM Server is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
