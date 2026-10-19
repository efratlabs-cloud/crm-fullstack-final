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
      maxlength: 20,
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
