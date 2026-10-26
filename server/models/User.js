const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: [6, "הסיסמה חייבת להכיל לפחות 6 תווים"],
    },
    googleId: {
      type: String,
      index: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  { timestamps: true },
);

// פונקציית עזר להשוואת סיסמה בהתחברות מול passwordHash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);

// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//       maxlength: 60,
//     },
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//       lowercase: true,
//     },
//     passwordHash: {
//       type: String,
//       required: function () {
//         return !this.googleId;
//       },
//       minlength: [6, "הסיסמה חייבת להכיל לפחות 6 תווים"],
//     },
//     googleId: {
//       type: String,
//       index: true,
//     },
//     role: {
//       type: String,
//       enum: ["admin", "user"], // מנהל (ראש משפחה) או חבר רגיל
//       default: "user",
//     },
//   },
//   { timestamps: true },
// );

// // הצפנת הסיסמה אוטומטית לפני שמירה במסד הנתונים
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password") || !this.password) {
//     return next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // פונקציית עזר להשוואת סיסמה בהתחברות
// userSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("User", userSchema);
