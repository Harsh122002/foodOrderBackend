import mongoose, { Schema } from "mongoose";

const GroupSchema = new Schema({
  groupName: { type: String, required: true, unique: true }, // New field for group name
  filePath: { type: String, required: true, unique: true }, // New field for file path
  timeAdded: { type: Date, default: Date.now },
});

const GroupItem = mongoose.model("GroupItem", GroupSchema);
export const findById = (id) => GroupItem.findById(id);
export default GroupItem;


