import Order from "../models/orderModal.js";
import User from "../models/userModal.js";
import ProductItem from "../models/productModal.js";
import Discount from "../models/discount.js";
import GroupItem from "../models/groupModal.js";

import upload from "../middleware/multerConfig.js";

export const RetrievalAllProductForDiscount = async (req, res) => {
  try {
    const products = await ProductItem.find();
    const groupNames = await Promise.all(
      products.map(async (product) => {
        const group = await GroupItem.findOne({ _id: product.groupName });

        return group ? group.groupName : null;
      })
    );

    const productsWithGroupNames = products.map((product, index) => ({
      ...product._doc,
      groupName: groupNames[index],
    }));
    res.status(200).json({ productsWithGroupNames });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const DiscountAdd = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    const {
      discountName,
      discountPercentage,
      productName,
      couponCode,
      couponDescription,
      groupName,
      startDate,
      endDate,
    } = req.body;
    const imagePath = req.file ? req.file.path : null;

    try {
      const discount = new Discount({
        discountName,
        discountPercentage,
        productName,
        groupName,
        couponCode,
        couponDescription,
        imagePath,
        startDate,
        endDate,
      });

      await discount.save();
      scheduleDiscountDeletion(discount._id, endDate);

      res.status(201).json({ message: "Discount added successfully", discount });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};
const scheduleDiscountDeletion = (discountId, endDate) => {
  const deleteDate = new Date(endDate);

  cron.schedule(`0 0 * * *`, async () => {
    const now = new Date();
    if (now >= deleteDate) {
      await Discount.findByIdAndDelete(discountId);
      console.log(`Discount with ID: ${discountId} deleted successfully.`);
    }
  });
};


export const AllDiscount = async (req, res) => {
  try {
    const discounts = await Discount.find();
    res.status(200).json(discounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const DiscountForId = async (req, res) => {
  const { id } = req.params;
  try {
    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }
    res.status(200).json(discount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const DiscountDelete = async (req, res) => {
  const { id } = req.params;
  try {
    const discount = await Discount.findByIdAndDelete(id);
    if (!discount) {
      return res.status(404).json({ message: "Discount not found" });
    }
    res.status(200).json({ message: "Discount deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const UpdateDiscount = async (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }

    const { id } = req.params;
    const {
      discountName,
      discountPercentage,
      productName,
      couponCode,
      couponDescription,
      groupName,
      startDate,
      endDate,
    } = req.body;
    const imagePath = req.file ? req.file.path : null;

    try {
      const discount = await Discount.findById(id);
      if (!discount) {
        return res.status(404).json({ message: "Discount not found" });
      }

      discount.discountName = discountName || discount.discountName;
      discount.discountPercentage = discountPercentage || discount.discountPercentage;
      discount.productName = productName || discount.productName;
      discount.couponCode = couponCode || discount.couponCode;
      discount.couponDescription = couponDescription || discount.couponDescription;
      discount.groupName = groupName || discount.groupName;
      discount.startDate = startDate || discount.startDate;
      discount.endDate = endDate || discount.endDate;
      if (imagePath) {
        discount.imagePath = imagePath;
      }

      await discount.save();
      res.status(200).json({ message: "Discount updated successfully", discount });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
};

