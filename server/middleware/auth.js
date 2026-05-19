const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const { isMainAdminUser } = require("../utils/adminAccess");

function getToken(req) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return null;
  return h.slice("Bearer ".length).trim();
}

async function applySellerSubscriptionRules(user) {
  if (user.status !== "seller") return user;
  const untilMs = user.sellerSubscriptionUntil
    ? new Date(user.sellerSubscriptionUntil).getTime()
    : 0;
  if (!untilMs || untilMs < Date.now()) {
    user.status = "buyer";
    user.sellerSubscriptionUntil = null;
    await user.save();
  }
  return user;
}

exports.authRequired = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ message: "Not authenticated" });

    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    const payload = jwt.verify(token, secret);

    let user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });

    user = await applySellerSubscriptionRules(user);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authenticated" });
  }
};

exports.requireRole = (roles) => (req, res, next) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (!allowed.includes(req.user.status)) {
    return res.status(403).json({ message: "Not authorized" });
  }
  next();
};

exports.requireMainAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (!isMainAdminUser(req.user)) {
    return res.status(403).json({ message: "רק מנהל ראשי יכול לבצע פעולה זו" });
  }
  next();
};

exports.optionalAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return next();
    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    const payload = jwt.verify(token, secret);
    let user = await User.findById(payload.userId);
    if (user) {
      user = await applySellerSubscriptionRules(user);
      req.user = user;
    }
  } catch (_) {
    /* treat as guest */
  }
  next();
};

