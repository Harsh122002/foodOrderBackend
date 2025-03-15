import Order from "../models/orderModal.js";
import User from "../models/userModel.js";
import Product from "../models/productModal.js";
import Discount from "../models/discount.js";
import Group from "../models/groupModel.js";

export const RetrievalAllProductForDiscount = async (req, res) => {
     try {
          const products = await Product.find();
          const groupNames = await Promise.all(products.map(async (product) => {
               const group = await Group.findById(product.groupId);
               return group ? group.groupName : null;
          }));
          res.status(200).json({ products, groupNames });
     } catch (error) {
          res.status(500).json({ message: error.message });
     }
};
