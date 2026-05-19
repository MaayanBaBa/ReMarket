const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "ProductModel", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  /** מתי הנמען צפה בהודעה; null = לא נקראה (רק הנמען מעדכן) */
  readAt: { type: Date, default: null },
});

module.exports = mongoose.model("MessageModel", messageSchema);