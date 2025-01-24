const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  mobile: { type: String },
  otp: { type: String },
  otpExpires: { type: Date },
  added: { type: Date, default: Date.now },
  update: { type: Date },

  address: { type: String },
  role: {
    type: String,
    enum: ["user", "admin","delivery"],
    default: "user",
  },
});

module.exports = mongoose.model("User", UserSchema);
