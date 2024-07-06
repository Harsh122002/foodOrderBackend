const jwt = require("jsonwebtoken");
const ProductItem = require("../models/productModal"); // Assuming this is your Mongoose model for ProductItem
const upload = require("../middleware/multerConfig"); // Assuming multer middleware for file uploads
const GroupItem = require("../models/groupModel");
const fs = require("fs"); // Node.js file system module for file operations

exports.addProductItem = (req, res) => {
  // Middleware function to handle file upload
  upload.single("imageFile")(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { productName, price, groupName } = req.body;
      const filePath = req.file.path;
      console.log(req.body);
      const existingGroup = await GroupItem.findById(groupName);
      if (!existingGroup) {
        return res.status(404).json({ error: "Group not found" });
      }

      // Create a new ProductItem instance using the Mongoose model
      const newProductItem = new ProductItem({
        productName,
        price,
        groupName,
        filePath,
      });

      // Save the new product item to the database
      await newProductItem.save();

      // Return success response with the new product item data
      res
        .status(201)
        .json({ message: "Product item added successfully", newProductItem });
    } catch (error) {
      // Handle any errors that occur during the process
      res.status(500).json({ error: error.message });
    }
  });
};

exports.getAllProduct = async (req, res) => {
  try {
    const AllProduct = await ProductItem.find();
    res.status(200).json(AllProduct);
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

    // Fetch the group item to get the image file path
    const productItem = await ProductItem.findById(id);
    if (!productItem) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Delete the associated image file (if it exists)
    if (productItem.filePath) {
      fs.unlinkSync(productItem.filePath); // Delete the file synchronously
    }

    // Delete the group item from the database
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
