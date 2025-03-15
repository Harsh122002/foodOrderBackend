import { Schema, model } from "mongoose";

const ProductSchema = new Schema({
  productName: { type: String, required: true },
  price: { type: String, required: true },
  groupName: {
    type: Schema.Types.ObjectId,
    ref: "GroupItem",
    required: true,
  },
  filePath: { type: String, required: true },
  description: { type: String },
  timeAdded: { type: Date, default: Date.now },
});

const ProductItem = model("ProductItem", ProductSchema);

export default ProductItem;
