const Category = require("../models/CategoryModel");
const defaultNames = require("../data/defaultCategories");

async function ensureDefaultCategories() {
  let added = 0;
  for (const name of defaultNames) {
    const exists = await Category.findOne({ name });
    if (!exists) {
      await Category.create({ name });
      added += 1;
    }
  }
  const total = await Category.countDocuments();
  if (added) {
    console.log(`Categories: נוספו ${added} קטגוריות ברירת מחדל (סה״כ ${total})`);
  }
}

module.exports = ensureDefaultCategories;
