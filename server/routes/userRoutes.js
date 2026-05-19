const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authRequired } = require("../middleware/auth");

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/me", authRequired, userController.me);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);

router.post("/", userController.addUser);
router.get("/", userController.getUsers);
router.get("/:id", userController.getById);
router.put("/:id", userController.update);
router.delete("/:id", userController.deleteUser);

module.exports = router;