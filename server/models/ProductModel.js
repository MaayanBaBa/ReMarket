const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 0, default: 1 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "CategoryModel", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },
  approved: { type: Boolean, default: false },
  AddedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ProductModel", productSchema);