const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 1. בדיקה שהמשתמש מחובר (יש לו טוקן תקין)
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // עודכן ל-passwordHash בהתאם למודל
      req.user = await User.findById(decoded.id).select("-passwordHash");
      if (!req.user) {
        return res.status(401).json({ message: "משתמש לא נמצא" });
      }
      next();
    } catch (error) {
      return res.status(401).json({ message: "אין הרשאה, טוקן לא תקין" });
    }
  } else {
    return res.status(401).json({ message: "אין הרשאה, חסר טוקן" });
  }
};

// 2. בדיקה שהמשתמש הוא מנהל (Admin)
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "גישה חסומה: נדרשת הרשאת מנהל (Admin)" });
  }
};

module.exports = { protect, adminOnly };
