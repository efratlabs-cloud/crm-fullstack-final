const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client();

const isAdminEmail = (email) => {
  const adminEmails = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase())
    : [];
  return adminEmails.includes(email.toLowerCase());
};

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// @desc הרשמת משתמש חדש
// @route POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "אנא מלא את כל השדות" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "הסיסמה חייבת להכיל לפחות 6 תווים" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "משתמש כבר קיים" });
    }

    // הצפנת הסיסמה לפני שמירה במסד הנתונים
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const shouldBeAdmin = isAdminEmail(email);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: shouldBeAdmin ? "admin" : "user",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "שגיאה בשרת", error: error.message });
  }
};

// @desc התחברות משתמש קיים
// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "אנא מלא את כל השדות" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "משתמש לא נמצא" });
    }

    // השוואת הסיסמה מול passwordHash שבמסד הנתונים
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "סיסמה שגויה" });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "שגיאה בשרת", error: error.message });
  }
};

// @desc Verify a Google ID token and sign in or register the Google user
// @route POST /api/auth/google-login
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body || {};
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res
        .status(503)
        .json({ message: "התחברות Google לא הוגדרה בשרת." });
    }

    if (typeof credential !== "string" || !credential) {
      return res.status(400).json({ message: "חסר אישור התחברות מ-Google." });
    }

    let googleUser;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      googleUser = ticket.getPayload();
    } catch (error) {
      console.error("Google token verification failed:", error);
      return res.status(401).json({ message: "אימות Google נכשל." });
    }

    if (
      !googleUser?.sub ||
      !googleUser.email ||
      googleUser.email_verified !== true
    ) {
      return res
        .status(401)
        .json({ message: "לא ניתן לאמת את חשבון Google." });
    }

    const email = googleUser.email.toLowerCase();
    const shouldBeAdmin = isAdminEmail(email);

    let user = await User.findOne({ googleId: googleUser.sub });
    if (!user) {
      user = await User.findOne({ email });
      if (user?.googleId && user.googleId !== googleUser.sub) {
        return res.status(409).json({
          message: "כתובת האימייל משויכת לחשבון Google אחר.",
        });
      }
    }

    if (!user) {
      user = await User.create({
        name: googleUser.name || email.split("@")[0],
        email,
        googleId: googleUser.sub,
        role: shouldBeAdmin ? "admin" : "user",
      });
    } else {
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        updated = true;
      }
      if (shouldBeAdmin && user.role !== "admin") {
        user.role = "admin";
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({ message: "שגיאת שרת בהתחברות עם Google." });
  }
};

// @desc קבלת פרטי המשתמש המחובר
// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getMe,
};
