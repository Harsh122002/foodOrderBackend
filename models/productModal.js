const { default: mongoose } = require("mongoose");

const ProductSchema = new mongoose.Schema({
  productName: { type: String, require: true },
  groupName: {
    type: mongoose.Schema.Types.groupName,
    ref: "GroupItem",
    required: true,
  }, // New field for group name
  filePath: { type: String, required: true }, // New field for file path
  timeAdded: { type: Date, default: Date.now },
});
