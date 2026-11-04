const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 11,
      set: (value) => {
        if (typeof value !== "string") return value;

        const phone = value.trim();
        if (
          !/^(?:0[2-4]|0[89]|05\d|07[2-9])-?\d{7}$/.test(phone)
        ) {
          return phone;
        }

        const digits = phone.replace("-", "");
        const prefixLength =
          digits.startsWith("05") || digits.startsWith("07") ? 3 : 2;
        return `${digits.slice(0, prefixLength)}-${digits.slice(prefixLength)}`;
      },
      validate: {
        validator: /^(?:0[2-4]|0[89]|05\d|07[2-9])-\d{7}$/,
        message:
          "מספר הטלפון אינו תקין. יש להזין מספר ישראלי, לדוגמה: 0501234567 או 050-1234567.",
      },
    },
    serviceType: {
      type: String,
      required: true,
      maxlength: 100,
    },
    status: {
      type: String,
      enum: ["חדש", "יצרו איתו קשר", "בטיפול", "לקוח משלם", "לא רלוונטי"],
      default: "חדש",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    //ישמור את הניסוח של ההודעה שה-AI יצר, אם היא קיימת
    //בעצם תקציר לצ'אט האחרון לאותו הליד, כדי שה-AI יוכל להמשיך את השיחה בצורה טבעית
    aiFollowUpDraft: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    //ישמור את הצעת המחיר שה-AI יצר, אם היא קיימת
    aiPriceQuote: {
      type: Number,
      default: 0,
    },
    //איש המכירות שמטפל בליד, אם יש כזה. זהו שדה אופציונלי, כי ייתכן שליד חדש עדיין לא הוקצה לאיש מכירות.
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Lead", leadSchema);
