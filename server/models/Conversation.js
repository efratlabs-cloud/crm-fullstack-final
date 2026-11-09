const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true },
);

ConversationSchema.index({ userId: 1 });

module.exports = mongoose.model("Conversation", ConversationSchema);
