import { Schema, model } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  mobile: { type: String },
  otp: { type: String },
  otpExpires: { type: Date },
  added: { type: Date, default: Date.now },
  update: { type: Date },
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  address: { type: String },
  role: {
    type: String,
    enum: ["user", "admin", "delivery"],
    default: "user",
  },
});

const User = model("User", UserSchema);


export default User;
