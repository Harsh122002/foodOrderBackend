const express = require("express");
const router = express.Router();
const {
  register,
  verifyOtp,
  login,
  requestPasswordReset,
  verifyOtpAndUpdatePassword,
  adminLogin,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-password", verifyOtpAndUpdatePassword);
router.post("/adminLogin", adminLogin);

module.exports = router;
