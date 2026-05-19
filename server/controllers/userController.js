const crypto = require("crypto");
const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const { isMainAdminUser } = require("../utils/adminAccess");

function userPublicFields(user) {
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    city: user.city,
    status: user.status,
    isMainAdmin: isMainAdminUser(user),
    sellerSubscriptionUntil: user.sellerSubscriptionUntil ?? null,
  };
}

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.addUser = async (req, res) => {
  try {
    if (req.body?.status === "admin") {
      return res.status(403).json({ message: "לא ניתן להירשם כמנהל" });
    }
    if (req.body?.status === "seller") {
      return res.status(400).json({
        message:
          "לא ניתן להירשם ישירות כמוכר. נרשמים כקונים, ואז ממלאים פרטי אשראי ומפעילים מנוי מוכר (20₪ לחודש) מהאתר.",
      });
    }
    if (req.body?.email) req.body.email = String(req.body.email).trim().toLowerCase();
    req.body.status = "buyer";
    const user = new User(req.body);
    await user.save();
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      city: user.city,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "האימייל כבר קיים במערכת" });
    }
    res.status(400).json({ message: err?.message || "Invalid user data" });
  }
};

exports.register = exports.addUser;

exports.login = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({
      email: new RegExp(`^${escapeRegExp(email)}$`, "i"),
    });
    if (!user) return res.status(401).json({ message: "אימייל או סיסמה לא נכונים" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "אימייל או סיסמה לא נכונים" });

    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: "7d" });

    return res.json({
      token,
      user: userPublicFields(user),
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Login failed" });
  }
};

const RESET_TOKEN_MS = 60 * 60 * 1000; // שעה

exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "נא להזין אימייל" });
    }

    const user = await User.findOne({
      email: new RegExp(`^${escapeRegExp(email)}$`, "i"),
    });
    const message =
      "אם כתובת האימייל רשומה אצלנו, תוכלי להשתמש בקישור לאיפוס הסיסמה (תקף לשעה).";

    if (!user) {
      return res.json({ message });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.passwordResetToken = hashed;
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_MS);
    await user.save({ validateBeforeSave: false });

    const resetPath = `/reset-password?token=${encodeURIComponent(
      rawToken
    )}&email=${encodeURIComponent(user.email)}`;

    return res.json({ message, resetPath });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "שגיאה בבקשת איפוס" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const token = String(req.body?.token || "");
    const password = String(req.body?.password || "");

    if (!email || !token || !password) {
      return res.status(400).json({ message: "חסרים אימייל, קוד איפוס או סיסמה חדשה" });
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email: new RegExp(`^${escapeRegExp(email)}$`, "i"),
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        message: "הקישור לא תקף או שפג תוקפו. נסי לבקש איפוס סיסמה מחדש.",
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: "הסיסמה עודכנה בהצלחה. אפשר להתחבר עם הסיסמה החדשה." });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "שגיאה באיפוס הסיסמה" });
  }
};

exports.me = async (req, res) => {
  return res.json(userPublicFields(req.user));
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await User.findById(req.params.id).select("-password");

    if (!item) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.update = async (req, res) => {
  try {
    if (req.body?.status === "admin") {
      return res.status(403).json({ message: "לא ניתן לשנות סטטוס למנהל" });
    }
    if (req.body?.status === "seller") {
      return res.status(403).json({
        message: "סטטוס מוכר מתעדכן רק דרך מנוי בתשלום (דף מנוי המוכר), לא דרך עריכת פרופיל.",
      });
    }
    const item = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).select("-password");

    if (!item) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params; // מזהה המשתמש
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).send("User not found");
    res.send({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};