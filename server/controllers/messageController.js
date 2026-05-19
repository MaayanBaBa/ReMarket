const mongoose = require("mongoose");
const Message = require("../models/MessageModel");
const Product = require("../models/ProductModel");
const { isMainAdminUser } = require("../utils/adminAccess");

/** פילטר זהה לרשימת ההודעות — לשימוש ב-getMessages ו-count */
async function buildInboxFilter(req) {
  const filter = {};
  if (isMainAdminUser(req.user)) {
    if (req.query.product) filter.product = req.query.product;
    if (req.query.sender) filter.sender = req.query.sender;
    if (req.query.receiver) filter.receiver = req.query.receiver;
    return { ok: true, filter };
  }

  const partyOr = [{ sender: req.user._id }, { receiver: req.user._id }];
  if (req.query.product) {
    const qPid = req.query.product;
    const ownsProduct = await Product.exists({ _id: qPid, user: req.user._id });
    const inThread = await Message.exists({
      product: qPid,
      $or: partyOr,
    });
    if (!ownsProduct && !inThread) {
      return {
        ok: false,
        status: 403,
        message: "אין הרשאה לצפות בהודעות למוצר זה",
      };
    }
    filter.$and = [{ $or: partyOr }, { product: qPid }];
  } else {
    filter.$or = partyOr;
  }
  return { ok: true, filter };
}


exports.addMessage = async (req, res) => {
  try {
    const product = await Product.findById(req.body?.product).populate("user");
    if (!product) return res.status(404).json({ message: "Product not found" });

    const sellerId = product.user?._id || product.user;
    const isSeller = req.user._id.equals(sellerId);
    if (product.approved === false && !isSeller && !isMainAdminUser(req.user)) {
      return res.status(400).json({ message: "מוצר עדיין לא אושר לפרסום" });
    }

    const stock = product.quantity ?? 0;
    if (stock <= 0 && !isSeller && !isMainAdminUser(req.user)) {
      const threadWithSeller = await Message.exists({
        product: product._id,
        $or: [
          { sender: req.user._id, receiver: sellerId },
          { sender: sellerId, receiver: req.user._id },
        ],
      });
      if (!threadWithSeller) {
        return res.status(410).json({ message: "המוצר אזל מהמלאי" });
      }
    }

    const content = String(req.body?.content || "").trim();
    if (!content) {
      return res.status(400).json({ message: "נא להזין תוכן הודעה" });
    }

    let receiverId;
    if (isSeller) {
      const buyerId = req.body?.receiver;
      if (!buyerId || !mongoose.Types.ObjectId.isValid(buyerId)) {
        return res.status(400).json({ message: "נא לציין למי לשלוח את התשובה (מזהה משתמש)" });
      }
      if (String(buyerId) === String(sellerId)) {
        return res.status(400).json({ message: "לא ניתן לשלוח הודעה לעצמך" });
      }
      const priorFromBuyer = await Message.findOne({
        product: product._id,
        sender: buyerId,
        receiver: sellerId,
      });
      if (!priorFromBuyer) {
        return res.status(403).json({
          message: "אין שיחה קיימת עם משתמש זה על מוצר זה — רק אחרי שהקונה שלח הודעה אפשר להשיב",
        });
      }
      receiverId = buyerId;
    } else {
      receiverId = product.user?._id || product.user;
    }

    const message = new Message({
      product: product._id,
      sender: req.user._id,
      receiver: receiverId,
      content,
    });
    await message.save();

    const populated = await Message.findById(message._id)
      .populate("sender", "firstName lastName email")
      .populate("receiver", "firstName lastName email")
      .populate("product", "name price image user");

    try {
      const { emitMessageNew, emitInboxRefresh } = require("../socket/chatHub");
      const sid = req.user._id.toString();
      const rid = (receiverId && receiverId._id ? receiverId._id : receiverId).toString();
      emitMessageNew(product._id.toString(), sid, rid, populated);
      emitInboxRefresh(sid);
      emitInboxRefresh(rid);
    } catch (e) {
      console.warn("chat emit:", e.message);
    }

    res.status(201).send(populated);
  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.getMessages = async (req, res) => {
  try {
    const built = await buildInboxFilter(req);
    if (!built.ok) {
      return res.status(built.status).json({ message: built.message });
    }

    const messages = await Message.find(built.filter)
      .populate("product")
      .populate("sender")
      .populate("receiver");

    res.send(messages);

  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.getMessageCount = async (req, res) => {
  try {
    /** רק "לא נקראו" — כל ההודעות (נקראו ולא) נשמרות ב-GET /messages */
    const count = await Message.countDocuments({
      receiver: req.user._id,
      readAt: null,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.markMessagesRead = async (req, res) => {
  try {
    const now = new Date();
    /** עדכון readAt בלבד; אין מחיקה — ההודעות נשארות בהיסטוריה */
    const result = await Message.updateMany(
      { receiver: req.user._id, readAt: null },
      { $set: { readAt: now } }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.getMessageById = async (req, res) => {
  try {

    const message = await Message.findById(req.params.id)
      .populate("product")
      .populate("sender")
      .populate("receiver");

    if (!message)
      return res.status(404).send("Message not found");

    res.send(message);

  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.updateMessage = async (req, res) => {
  try {

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!message)
      return res.status(404).send("Message not found");

    res.send(message);

  } catch (err) {
    res.status(500).send(err.message);
  }
};


exports.deleteMessage = async (req, res) => {
  try {

    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message)
      return res.status(404).send("Message not found");

    res.send("Message deleted");

  } catch (err) {
    res.status(500).send(err.message);
  }
};