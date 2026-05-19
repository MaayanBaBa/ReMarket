const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");
const { authRequired } = require("../middleware/auth");

router.post("/", authRequired, saleController.addSale);
router.get("/", authRequired, saleController.getSales);
router.get("/:id", authRequired, saleController.getSaleById);
router.put("/:id", authRequired, saleController.updateSale);
router.delete("/:id", authRequired, saleController.deleteSale);

module.exports = router;