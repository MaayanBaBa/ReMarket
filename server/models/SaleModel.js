const mongoose = require("mongoose");

const TRACKING_STATUSES = [
  "pending",
  "preparing",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

const saleSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "ProductModel", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },
  customerName: { type: String },
  customerPhone: { type: String },
  shippingAddress: { type: String },
  notes: { type: String },
  saleDate: { type: Date, default: Date.now },
  trackingStatus: {
    type: String,
    enum: TRACKING_STATUSES,
    default: "pending",
  },
  /** איפה החבילה נמצאת כרגע (טקסט חופשי) */
  trackingLocation: {
    type: String,
    default: "ההזמנה התקבלה — ממתין לטיפול המוכר",
  },
  /** מתי צפוי שהמשלוח יגיע לכתובת שנבחרה */
  estimatedDeliveryAt: { type: Date, default: null },
  trackingNote: { type: String, default: "" },
  trackingUpdatedAt: { type: Date, default: null },
});

const SaleModel = mongoose.model("SaleModel", saleSchema);
SaleModel.TRACKING_STATUSES = TRACKING_STATUSES;
module.exports = SaleModel;