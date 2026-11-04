const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Conversation = require("../models/Conversation");

class MongoSession {
  constructor(userId) {
    this.userId = userId ? String(userId) : null;
  }

  getObjectId() {
    if (!this.userId) return null;
    return mongoose.Types.ObjectId.isValid(this.userId)
      ? new mongoose.Types.ObjectId(this.userId)
      : null;
  }

  async getSessionId() {
    return this.userId;
  }

  async getItems(limit) {
    await connectDB();
    const objectId = this.getObjectId();
    if (!objectId) return [];

    const conversation = await Conversation.findOne({
      userId: objectId,
    }).lean();
    const items = conversation?.items ?? [];
    return typeof limit === "number" ? items.slice(-limit) : items;
  }

  async addItems(items) {
    if (!Array.isArray(items) || items.length === 0) return;

    const objectId = this.getObjectId();
    if (!objectId) return;

    await connectDB();

    await Conversation.findOneAndUpdate(
      { userId: objectId },
      { $push: { items: { $each: items } } },
      { upsert: true, new: true },
    );
  }

  async popItem() {
    const objectId = this.getObjectId();
    if (!objectId) return undefined;

    await connectDB();
    const conversation = await Conversation.findOne({ userId: objectId });
    if (
      !conversation ||
      !Array.isArray(conversation.items) ||
      conversation.items.length === 0
    ) {
      return undefined;
    }

    const item = conversation.items[conversation.items.length - 1];
    conversation.items.pop();
    await conversation.save();
    return item;
  }

  async clearSession() {
    const objectId = this.getObjectId();
    if (!objectId) return;

    await connectDB();
    await Conversation.deleteOne({ userId: objectId });
  }

  async getMessages() {
    return this.getItems();
  }

  async addMessages(newMessages) {
    return this.addItems(newMessages);
  }
}

module.exports = { MongoSession };
