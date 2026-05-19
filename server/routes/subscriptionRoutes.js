const express = require("express");
const router = express.Router();
const { authRequired } = require("../middleware/auth");
const { isMainAdminUser } = require("../utils/adminAccess");

// 20₪ per month – simulated payment (we do NOT store card details)
router.get("/status", authRequired, async (req, res) => {
  const until = req.user.sellerSubscriptionUntil;
  const active =
    req.user.status === "seller" && until && new Date(until).getTime() > Date.now();
  res.json({ status: req.user.status, sellerSubscriptionUntil: until, active });
});

router.post("/subscribe", authRequired, async (req, res) => {
  try {
    if (isMainAdminUser(req.user)) {
      return res.status(400).json({ message: "למנהל ראשי אין צורך במנוי מוכר" });
    }

    // basic validation (simulation only)
    const cardNumber = String(req.body?.cardNumber || "").replace(/\s/g, "");
    const expiry = String(req.body?.expiry || "");
    const cvv = String(req.body?.cvv || "");
    const cardHolder = String(req.body?.cardHolder || "");

    if (!/^\d{16}$/.test(cardNumber)) {
      return res.status(400).json({ message: "יש להזין מספר כרטיס בן 16 ספרות (ללא רווחים)" });
    }
    if (!expiry.trim()) {
      return res.status(400).json({ message: "נא למלא תוקף כרטיס" });
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      return res.status(400).json({ message: "נא למלא CVV תקין (3 או 4 ספרות)" });
    }
    if (!cardHolder.trim()) {
      return res.status(400).json({ message: "נא למלא שם בעל הכרטיס" });
    }

    const now = Date.now();
    const currentUntil = req.user.sellerSubscriptionUntil
      ? new Date(req.user.sellerSubscriptionUntil).getTime()
      : 0;
    const base = currentUntil > now ? currentUntil : now;
    const nextUntil = new Date(base + 30 * 24 * 60 * 60 * 1000); // ~30 days

    req.user.status = "seller";
    req.user.sellerSubscriptionUntil = nextUntil;
    await req.user.save();

    return res.json({
      message: "המנוי הופעל (20₪ לחודש, סימולציה) — חשבונך הוגדר כמוכר",
      status: req.user.status,
      sellerSubscriptionUntil: req.user.sellerSubscriptionUntil,
    });
  } catch (err) {
    return res.status(500).json({ message: err?.message || "Subscription failed" });
  }
});

module.exports = router;

