const Product = require("../models/ProductModel");
const Message = require("../models/MessageModel");
const { isMainAdminUser } = require("../utils/adminAccess");

function isPublishedProduct(doc) {
  return doc.approved !== false;
}

exports.addProduct = async (req, res) => {
  try {
    const autoApprove = isMainAdminUser(req.user);
    const price = Number(req.body?.price);
    const quantity = Math.floor(Number(req.body?.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ message: "נא להזין כמות במלאי (מספר שלם חיובי)" });
    }
    let image = String(req.body?.image || "").trim();
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }
    const product = new Product({
      name: req.body?.name,
      description: req.body?.description,
      image,
      price,
      quantity,
      category: req.body?.category,
      user: req.user._id,
      approved: autoApprove,
    });
    await product.save();
    res.status(201).send(product);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ approved: false })
      .populate("category")
      .populate("user");
    res.send(products);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {
      approved: { $ne: false },
      quantity: { $gt: 0 },
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      filter.category = category;
    }

    const products = await Product.find(filter)
      .populate("category")
      .populate("user");
    res.send(products);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("user");

    if (!product) return res.status(404).send("Product not found");

    const ownerId = product.user?._id?.toString() || product.user?.toString();
    const viewerId = req.user?._id?.toString();
    const isOwner = !!(viewerId && ownerId === viewerId);
    const mainAdmin = req.user && isMainAdminUser(req.user);
    if (!isPublishedProduct(product) && !isOwner && !mainAdmin) {
      return res.status(404).send("Product not found");
    }

    const qty = product.quantity ?? 0;
    if (qty <= 0 && !isOwner && !mainAdmin) {
      const viewerOid = req.user?._id;
      const ownerOid = product.user?._id || product.user;
      if (viewerOid) {
        const continuedChat = await Message.exists({
          product: product._id,
          $or: [
            { sender: viewerOid, receiver: ownerOid },
            { sender: ownerOid, receiver: viewerOid },
          ],
        });
        if (continuedChat) {
          return res.send(product);
        }
      }
      return res.status(410).json({ message: "המוצר אזל מהמלאי", code: "OUT_OF_STOCK" });
    }

    res.send(product);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateProduct = async (req, res) => {
  try {

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!product)
      return res.status(404).send("Product not found");

    res.send(product);

  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteProduct = async (req, res) => {
  try {

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product)
      return res.status(404).send("Product not found");

    res.send("Product deleted");

  } catch (err) {
    res.status(500).send(err.message);
  }
};