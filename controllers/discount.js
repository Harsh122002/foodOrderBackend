import Order from "../models/orderModal.js";
import User from "../models/userModal.js";
import ProductItem from "../models/productModal.js";
import Discount from "../models/discount.js";
import GroupItem from "../models/groupModal.js";

export const RetrievalAllProductForDiscount = async (req, res) => {
  try {
    const products = await ProductItem.find();
    const groupNames = await Promise.all(
      products.map(async (product) => {
      const group = await GroupItem.findOne({ _id: product.groupName });
      console.log(group);
      
      return group ? group.groupName : null;
      })
    );

    const productsWithGroupNames = products.map((product, index) => ({
      ...product._doc,
      groupName: groupNames[index]
    }));
    res.status(200).json({ productsWithGroupNames });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
