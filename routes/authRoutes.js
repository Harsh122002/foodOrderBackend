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
  gauthenticateJWT,UpdateUser,
  getUserCount,
  getAllUser,
  githubLogin,
  githubCallback,
  DeleteUser,
  UserUpdate,
  getUserDetail,
  UpdateUserDetail,
  GoogleRegister,
} = require("../controllers/authController");
const {
  addGroupItem,
  getAllGroupItems,
  DeleteGroup,
  UpdateGroupItem,
  addUpdateGroupItem,
} = require("../controllers/group");
const authenticateJWT = require("../middleware/authMiddleware");
const {
  addProductItem,
  getAllProduct,
  getProductsByGroup,
  DeleteProduct,
  UpdateProductItem,
  addUpdateProductItem,
} = require("../controllers/product");
const {
  OrderDetail,
  getAllOrder,
  OrderDelete,

  getAllOrderStatuses,
  getAllPendingOrder,
  updateOrderStatus,
  getAllCompleteOrder,
  getAllDeclinedOrder,
  getAllRunningOrder,
  getAllPaymentAmount,
  updateRating,
  getMonthlyCompleteOrder,
} = require("../controllers/order");
const { GeneratePdf } = require("../controllers/generatePdf");
const { Payment, PaymentVerify } = require("../controllers/payment");

router.post("/register", register);
router.post("/googleRegister", GoogleRegister);
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
router.put("/updateUserDetail", authenticateJWT, UpdateUserDetail);
router.post("/orderDelete", OrderDelete);
router.post("/getAllOrder", getAllOrder);
router.get("/order-statuses", getAllOrderStatuses);
router.get("/user-count", getUserCount);
router.get("/all-pending-orders", getAllPendingOrder);
router.get("/all-completed-orders", getAllCompleteOrder);
router.get("/all-running-orders", getAllRunningOrder);
router.get("/all-declined-orders", getAllDeclinedOrder);
router.get("/all-users", getAllUser);
router.delete(`/deleteGroup/:id`, DeleteGroup);
router.get(`/getProductsByGroup/:groupName`, getProductsByGroup);
router.post("/update-order-status", updateOrderStatus);
router.delete(`/deleteProduct/:id`, DeleteProduct);
router.get("/getTotalAmount", getAllPaymentAmount);
router.post("/updateRating", updateRating);
router.post("/updateGroup", UpdateGroupItem);
router.post("/update-Group", addUpdateGroupItem);
router.post("/updateProduct", UpdateProductItem);
router.post("/update-Proudct", addUpdateProductItem);
router.put("/update-user/:id",UserUpdate)
router.delete("/delete-user/:id", DeleteUser);
router.get("/getMonthlyComplete",getMonthlyCompleteOrder)
router.get("/auth/github", githubLogin);
router.get("/auth/github/callback", githubCallback);

module.exports = router;
