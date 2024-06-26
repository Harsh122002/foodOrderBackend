const express = require("express");
const router = express.Router();
const {
  register,
  verifyOtp,
  login,
  requestPasswordReset,
  verifyOtpAndUpdatePassword,
  adminLogin,
  verifyToken,
  getUserDetail,
} = require("../controllers/authController");
const { addGroupItem, getAllGroupItems } = require("../controllers/group");
const authenticateJWT = require("../middleware/authMiddleware");
const { addProductItem, getAllProduct } = require("../controllers/product");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-password", verifyOtpAndUpdatePassword);
router.post("/adminLogin", adminLogin);
router.post("/addGroupItem", authenticateJWT, addGroupItem);
router.get("/getAllGroup", getAllGroupItems);
router.post("/addProduct", authenticateJWT, addProductItem);
router.get("/getAllProduct", getAllProduct);
router.post("/getUserDetail", authenticateJWT, getUserDetail);

module.exports = router;
