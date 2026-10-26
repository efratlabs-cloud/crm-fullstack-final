const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'נא להזין את שם הפרויקט'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    // קשר ישיר לישות Lead (הליד שממנו נוצר הפרויקט)
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'פרויקט חייב להיות משויך לליד קיים'],
    },
    status: {
      type: String,
      enum: ['בביצוע', 'הסתיים', 'הושהה', 'בדיקות'],
      default: 'בביצוע',
    },
    budget: {
      type: Number,
      default: 0,
    },
    deadline: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);