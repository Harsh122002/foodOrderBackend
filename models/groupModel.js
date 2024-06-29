const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true, unique: true }, // New field for group name
  filePath: { type: String, required: true, unique: true }, // New field for file path
  timeAdded: { type: Date, default: Date.now },
});
module.exports = mongoose.model("GroupItem", GroupSchema);
