import { Router } from "express";
const router = Router();
import {
  register,
  verifyOtp,
  login,
  requestPasswordReset,
  verifyOtpAndUpdatePassword,
  adminLogin,
  getUserCount,
  getAllUser,
  githubLogin,
  githubCallback,
  DeleteUser,
  UserUpdate,
  getUserDetail,
  UpdateUserDetail,
  GoogleRegister,
  DeliveryBoyRegister,
  BoyLogin,
  logOut,
  GetAllOnlineBoy,
} from "../controllers/authController.js";
import {
  addGroup,
  addUpdateGroup,
  DeleteGroup,
  getAllGroups,
  UpdateGroupItem,
} from "../controllers/group.js";
import authenticateJWT from "../middleware/authMiddleware.js";
import {
  addProductItem,
  getAllProduct,
  getProductsByGroup,
  DeleteProduct,
  UpdateProductItem,
  addUpdateProductItem,
  getAllProductForAdmin,
  ProductsByGroupId,
} from "../controllers/product.js";
import {
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
  getMonthlyOrderAmounts,
  fetchOrderByBoyName,
  AllCompletedOrderForUserId,
} from "../controllers/order.js";
import { GeneratePdf } from "../controllers/generatePdf.js";
import { Payment, PaymentVerify } from "../controllers/payment.js";
import {
  AllDiscount,
  DiscountAdd,
  DiscountDelete,
  DiscountForId,
  RetrievalAllProductForDiscount,
  UpdateDiscount,
} from "../controllers/discount.js";

router.post("/register", register);
router.post("/googleRegister", GoogleRegister);
router.post("/deliveryBoyRegister", DeliveryBoyRegister);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/boyLogin", BoyLogin);
router.post("/addGroup",authenticateJWT, addGroup);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-password", verifyOtpAndUpdatePassword);
router.post("/adminLogin", adminLogin);
router.post("/addGroupItem", authenticateJWT, UpdateGroupItem);
router.get("/getAllGroup", getAllGroups);
router.post("/addProduct", authenticateJWT, addProductItem);
router.get("/getAllProduct/:page", getAllProduct);
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
router.post("/update-Group", addUpdateGroup);
router.post("/updateProduct", UpdateProductItem);
router.post("/update-Product", addUpdateProductItem);
router.put("/update-user/:id", UserUpdate);
router.delete("/delete-user/:id", DeleteUser);
router.get("/getMonthlyComplete", getMonthlyCompleteOrder);
router.get("/getMonthlyOrderAmounts", getMonthlyOrderAmounts);

router.get("/auth/github", githubLogin);
router.get("/logout/:id", logOut);
router.get("/getAllProductForAdmin", getAllProductForAdmin);
router.get("/auth/github/callback", githubCallback);
router.get("/AllDiscountProduct", RetrievalAllProductForDiscount);
router.post("/addDiscount", DiscountAdd);
router.get("/allDiscount", AllDiscount);
router.get("/DiscountForId/:id", DiscountForId);
router.put("/UpdateDiscount/:id", UpdateDiscount);
router.delete(`/discountDelete/:id`,DiscountDelete)
router.get("/boy", GetAllOnlineBoy);
router.post("/AllCompletedOrderForUserId",AllCompletedOrderForUserId)
router.post("/fetchOrderByBoyName", fetchOrderByBoyName);
router.get("/getProductsByGroupId/:id", ProductsByGroupId);
export default router;
