const Category = require("../models/CategoryModel");
const Product = require("../models/ProductModel");

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.addCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).send(category);
  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.send(categories);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

/** מוכר/מנהל: מוצא קטגוריה לפי שם (ללא רגישות לאותיות) או יוצר חדשה */
exports.findOrCreateCategory = async (req, res) => {
  try {
    const raw = String(req.body?.name || "").trim();
    if (raw.length < 2) {
      return res.status(400).json({ message: "נא להזין שם קטגוריה (לפחות 2 תווים)" });
    }
    if (raw.length > 80) {
      return res.status(400).json({ message: "שם קטגוריה ארוך מדי" });
    }

    const existing = await Category.findOne({
      name: new RegExp(`^${escapeRegExp(raw)}$`, "i"),
    });
    if (existing) {
      return res.status(200).json(existing);
    }

    const cat = await Category.create({ name: raw });
    return res.status(201).json(cat);
  } catch (err) {
    return res.status(500).json({ message: err.message || "שגיאה ביצירת קטגוריה" });
  }
};

exports.getCategoriesWithCounts = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: Product.collection.name,
          let: { catId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$category", "$$catId"] },
                    { $ne: ["$approved", false] },
                    { $gt: [{ $ifNull: ["$quantity", 0] }, 0] },
                  ],
                },
              },
            },
          ],
          as: "products",
        },
      },
      {
        $addFields: {
          count: { $size: '$products' }
        }
      },
      {
        $project: {
          products: 0
        }
      },
      {
        $sort: { name: 1 }
      }
    ])

    res.send(categories);
  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.getCategoryById = async (req, res) => {
  try {

    const category = await Category.findById(req.params.id);

    if (!category)
      return res.status(404).send("Category not found");

    res.send(category);

  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.updateCategory = async (req, res) => {
  try {

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!category)
      return res.status(404).send("Category not found");

    res.send(category);

  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.deleteCategory = async (req, res) => {
  try {

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category)
      return res.status(404).send("Category not found");

    res.send("Category deleted");

  } catch (err) {
    res.status(500).send(err.message);
  }
};