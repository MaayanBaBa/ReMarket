const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authRequired, requireRole } = require("../middleware/auth");

router.post("/", categoryController.addCategory);
router.get("/", categoryController.getCategories);
router.get("/with-counts", categoryController.getCategoriesWithCounts);
router.post(
  "/find-or-create",
  authRequired,
  requireRole(["seller", "admin"]),
  categoryController.findOrCreateCategory
);
router.get("/:id", categoryController.getCategoryById);
router.put("/:id", categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;