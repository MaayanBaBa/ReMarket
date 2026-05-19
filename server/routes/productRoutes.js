const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authRequired, requireRole, requireMainAdmin, optionalAuth } = require("../middleware/auth");
const uploadProductImage = require("../middleware/uploadProductImage");

router.post(
  "/",
  authRequired,
  requireRole(["seller", "admin"]),
  uploadProductImage.single("image"),
  productController.addProduct
);
router.get(
  "/pending-approval",
  authRequired,
  requireMainAdmin,
  productController.getPendingProducts
);
router.get("/", productController.getProducts);
router.get("/:id", optionalAuth, productController.getProductById);
router.put("/:id", authRequired, requireMainAdmin, productController.updateProduct);
router.delete("/:id", authRequired, requireMainAdmin, productController.deleteProduct);

module.exports = router;