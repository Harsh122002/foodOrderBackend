// models/Order.js
import { Schema, model } from "mongoose";

const orderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  rating: { type: String, default: null },
  ratingDescription: { type: String, default: null },

  products: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["cash", "online"], required: true },
  status: {
    type: String,
    enum: ["pending", "running", "completed", "declined", "return", "returned"], // list all valid statuses
    default: "pending",
  },
  discountName:{ type: String},
  discountPercentage: { type: Number },
  deliveryCharge: { type: Number },
  couponCode: { type: String },
  couponDiscount: { type: Number },
  orderNote: { type: String },
  orderRef: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default model("Order", orderSchema);
