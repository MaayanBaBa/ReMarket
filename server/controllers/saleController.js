const mongoose = require("mongoose");
const Sale = require("../models/SaleModel");
const Product = require("../models/ProductModel");
const { isMainAdminUser } = require("../utils/adminAccess");
const TRACKING_STATUSES = Sale.TRACKING_STATUSES;


exports.addSale = async (req, res) => {
  try {
    const productId = req.body?.product;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "מוצר לא תקין" });
    }

    const product = await Product.findById(productId).populate("user");
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.approved === false) {
      return res.status(400).json({ message: "Product is not approved" });
    }

    const sellerOid = product.user?._id || product.user;
    if (req.user._id.equals(sellerOid)) {
      return res.status(400).json({ message: "לא ניתן לרכוש את המוצר שלך" });
    }

    const qty = product.quantity ?? 0;
    if (qty < 1) {
      return res.status(400).json({ message: "אזל מהמלאי" });
    }

    const updated = await Product.findOneAndUpdate(
      { _id: productId, approved: { $ne: false }, quantity: { $gt: 0 } },
      { $inc: { quantity: -1 } },
      { new: true }
    ).populate("user");

    if (!updated) {
      return res.status(400).json({ message: "אזל מהמלאי — נסי שוב" });
    }

    try {
      const sale = await Sale.create({
        product: updated._id,
        seller: updated.user?._id || updated.user,
        buyer: req.user._id,
        customerName: req.body?.customerName,
        customerPhone: req.body?.customerPhone,
        shippingAddress: req.body?.shippingAddress,
        notes: req.body?.notes,
        trackingStatus: "pending",
        trackingLocation: "ההזמנה התקבלה — ממתין לטיפול המוכר",
        trackingUpdatedAt: new Date(),
      });
      res.status(201).send(sale);
    } catch (err) {
      await Product.updateOne({ _id: productId }, { $inc: { quantity: 1 } });
      throw err;
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getSales = async (req, res) => {
  try {
    const filter = {};
    const role = String(req.query.role || "buyer");

    if (isMainAdminUser(req.user)) {
      if (req.query.buyer) filter.buyer = req.query.buyer;
      if (req.query.seller) filter.seller = req.query.seller;
      if (req.query.product) filter.product = req.query.product;
    } else if (role === "seller") {
      if (req.user.status !== "seller" && req.user.status !== "admin") {
        return res.status(403).json({ message: "אין הרשאה" });
      }
      filter.seller = req.user._id;
    } else {
      filter.buyer = req.user._id;
    }

    const sales = await Sale.find(filter)
      .sort({ saleDate: -1 })
      .populate("product")
      .populate("seller")
      .populate("buyer");

    res.send(sales);

  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("product")
      .populate("seller")
      .populate("buyer");

    if (!sale) return res.status(404).json({ message: "לא נמצאה הזמנה" });

    const uid = req.user?._id;
    const buyerId = sale.buyer?._id || sale.buyer;
    const sellerId = sale.seller?._id || sale.seller;
    const isBuyer = uid && buyerId && buyerId.equals(uid);
    const isSeller = uid && sellerId && sellerId.equals(uid);
    const isMain = isMainAdminUser(req.user);
    if (!isBuyer && !isSeller && !isMain) {
      return res.status(403).json({ message: "אין הרשאה לצפות בהזמנה" });
    }

    res.send(sale);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.updateSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "לא נמצאה הזמנה" });

    const sellerId = sale.seller;
    const isSeller = req.user._id.equals(sellerId);
    const isMain = isMainAdminUser(req.user);
    if (!isSeller && !isMain) {
      return res.status(403).json({ message: "רק המוכר או מנהל ראשי יכולים לעדכן מעקב משלוח" });
    }

    const allowed = ["trackingStatus", "trackingLocation", "estimatedDeliveryAt", "trackingNote"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (updates.trackingStatus !== undefined && !TRACKING_STATUSES.includes(updates.trackingStatus)) {
      return res.status(400).json({ message: "סטטוס מעקב לא חוקי" });
    }

    if (updates.estimatedDeliveryAt !== undefined) {
      if (updates.estimatedDeliveryAt === null || updates.estimatedDeliveryAt === "") {
        updates.estimatedDeliveryAt = null;
      } else {
        const d = new Date(updates.estimatedDeliveryAt);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ message: "תאריך צפוי לא תקין" });
        }
        updates.estimatedDeliveryAt = d;
      }
    }

    Object.assign(sale, updates);
    if (Object.keys(updates).length > 0) {
      sale.trackingUpdatedAt = new Date();
    }
    await sale.save();

    const fresh = await Sale.findById(sale._id)
      .populate("product")
      .populate("seller")
      .populate("buyer");
    res.send(fresh);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.deleteSale = async (req, res) => {
  try {

    const sale = await Sale.findByIdAndDelete(req.params.id);

    if (!sale)
      return res.status(404).send("Sale not found");

    res.send("Sale deleted");

  } catch (err) {
    res.status(500).send(err.message);
  }
};