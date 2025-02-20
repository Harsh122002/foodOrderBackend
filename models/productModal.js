const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  price: { type: String, required: true },
  groupName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GroupItem",
    required: true,
  }, // Assuming `GroupItem` is the model name for group references
  filePath: { type: String, required: true },
  description: { type: String, require: false },
  timeAdded: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ProductItem", ProductSchema);
