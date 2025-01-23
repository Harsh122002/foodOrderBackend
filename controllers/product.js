const jwt = require("jsonwebtoken");
const ProductItem = require("../models/productModal");
const upload = require("../middleware/multerConfig");
const GroupItem = require("../models/groupModel");
const fs = require("fs");

exports.addProductItem = (req, res) => {
  upload.single("imageFile")(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { productName, price, groupName, description } = req.body;
      const filePath = req.file.path;
      console.log(req.body);
      const existingGroup = await GroupItem.findById(groupName);
      if (!existingGroup) {
        return res.status(404).json({ error: "Group not found" });
      }

      const newProductItem = new ProductItem({
        productName,
        price,
        groupName,
        filePath,
        description,
      });

      await newProductItem.save();

      res
        .status(201)
        .json({ message: "Product item added successfully", newProductItem });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

exports.getAllProduct = async (req, res) => {
  try {
    const products = await ProductItem.find();
    const allProductsWithGroups = await Promise.all(
      products.map(async (product) => {
        const group = await GroupItem.findOne({ _id: product.groupName });
        return {
          ...product._doc,
          groupDetails: group || null,
        };
      })
    );
    res.status(200).json(allProductsWithGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductsByGroup = async (req, res) => {
  try {
    const { groupName } = req.params;
    console.log({ groupName });
    const products = await ProductItem.find({ groupName });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by group:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.DeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Group ID to delete:", id);

    const productItem = await ProductItem.findById(id);
    if (!productItem) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (productItem.filePath) {
      fs.unlinkSync(productItem.filePath);
    }

    const deletedProduct = await ProductItem.findByIdAndDelete(id);
    if (deletedProduct) {
      res.status(200).json({
        message: "Product and associated image deleted successfully.",
      });
    } else {
      res.status(404).json({ message: "Product not found." });
    }
  } catch (error) {
    console.error("Error deleting Product:", error);
    res.status(500).json({ message: "Failed to delete Product." });
  }
};
exports.UpdateProductItem = async (req, res) => {
  try {
    const { productId } = req.body;

    const productItem = await ProductItem.findOne({ _id: productId });

    if (!productItem) {
      return res.status(404).json({ message: "Group item not found" });
    }
    res.status(200).json({
      productName: productItem.productName,
      filePath: productItem.filePath,
      price: productItem.price,
      groupName: productItem.groupName,
      description: productItem.description,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.addUpdateProductItem = (req, res) => {
  upload.single("imageFile")(req, res, async (err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Failed to upload image. Please try again." });
    }

    try {
      const { productId, productName, price, groupName, description } = req.body;
      const imageFile = req.file ? req.file.filename : null;
      const product = await ProductItem.findById({ _id: productId });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      product.productName = productName || product.productName;
      product.price = price || product.price;
      product.groupName = groupName || product.groupName;
      product.description = description || product.description
      if (imageFile) {
        product.imageFile = imageFile;
      }

      await product.save();

      res
        .status(200)
        .json({ status: true, message: "Product updated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to update product. Please try again." });
    }
  });
};
