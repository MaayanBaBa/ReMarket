const Product = require("../models/ProductModel");

async function ensureProductQuantity() {
  const r = await Product.updateMany(
    { quantity: { $exists: false } },
    { $set: { quantity: 1 } }
  );
  if (r.modifiedCount) {
    console.log(`Products: נוספה כמות ברירת מחדל (1) ל-${r.modifiedCount} מוצרים ישנים`);
  }
}

module.exports = ensureProductQuantity;
