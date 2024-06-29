const jwt = require("jsonwebtoken");
const ProductItem = require("../models/productModal"); // Assuming this is your Mongoose model for ProductItem
const upload = require("../middleware/multerConfig"); // Assuming multer middleware for file uploads
const GroupItem = require("../models/groupModel");
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

      const { productName, groupName } = req.body;
      const filePath = req.file.path;
      console.log(req.body);
      const existingGroup = await GroupItem.findById(groupName);
      if (!existingGroup) {
        return res.status(404).json({ error: "Group not found" });
      }

      // Create a new ProductItem instance using the Mongoose model
      const newProductItem = new ProductItem({
        productName,
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
