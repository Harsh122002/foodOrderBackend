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
const { OrderDetail } = require("../controllers/order");
const { GeneratePdf } = require("../controllers/generatePdf");
const { Payment, PaymentVerify } = require("../controllers/payment");

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
router.post("/orderDetail", authenticateJWT, OrderDetail);
router.post("/generatePdf", GeneratePdf);
router.post("/payment", Payment);
router.post("/verify", PaymentVerify);

module.exports = router;
