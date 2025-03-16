import ProductItem from "../models/productModal.js";
import GroupItem from "../models/groupModal.js"; // Assuming this model contains group info
import upload from "../middleware/multerConfig.js";
import { unlinkSync } from "fs";

// Add Product Item
export function addProductItem(req, res) {
 upload.single("imageFile")(req, res, async (err) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const { productName, price, groupName, description } = req.body;
      const filePath = req.file.path;

      // Check if group exists
      const existingGroup = await Group.findById(groupName);
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

      res.status(201).json({
        message: "Product item added successfully",
        product: newProductItem,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

// Get All Products with Pagination
export async function getAllProduct(req, res) {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    const products = await ProductItem.find().skip(skip).limit(limit);
    const totalProducts = await ProductItem.countDocuments();

    if (!products.length) {
      return res.status(404).json({ message: "No products found on this page" });
    }

    const productsWithGroups = await Promise.all(
      products.map(async (product) => {
        const group = await GroupItem.findById(product.groupName);
        return {
          ...product.toObject(),
          groupDetails: group || null,
        };
      })
    );

    res.status(200).json({
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
      products: productsWithGroups,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: error.message });
  }
}
export async function getAllProductForAdmin(req, res) {
  try {
    const products = await ProductItem.find();
    const productsWithGroups = await Promise.all(
      products.map(async (product) => {
        const group = await GroupItem.findById(product.groupName);
        return {
          ...product.toObject(),
          groupDetails: group || null,
        };
      })
    );

    res.status(200).json(productsWithGroups);
  } catch (error) {
    console.error("Error fetching all products for admin:", error);
    res.status(500).json({ error: error.message });
  }
}

// Get Products by Group
export async function getProductsByGroup(req, res) {
  try {
    const { groupName } = req.params;
    const products = await ProductItem.find({ groupName });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products by group:", error);
    res.status(500).json({ message: "Server error" });
  }
}

// Delete Product
export async function DeleteProduct(req, res) {
  try {
    const { id } = req.params;

    const productItem = await ProductItem.findById(id);
    if (!productItem) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Remove file if exists
    if (productItem.filePath) {
      unlinkSync(productItem.filePath);
    }

    await ProductItem.findByIdAndDelete(id);

    res.status(200).json({
      message: "Product and associated image deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product." });
  }
}

// Get Single Product for Update (fetch data)
export async function UpdateProductItem(req, res) {
  try {
    const { productId } = req.body;

    const productItem = await ProductItem.findById(productId);
    if (!productItem) {
      return res.status(404).json({ message: "Product item not found" });
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
}

// Add or Update Product
export function addUpdateProductItem(req, res) {
  upload.single("imageFile")(req, res, async (err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Failed to upload image. Please try again." });
    }

    try {
      const { productId, productName, price, groupName, description } = req.body;
      let product = await ProductItem.findById(productId);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Update product fields
      product.productName = productName || product.productName;
      product.price = price || product.price;
      product.groupName = groupName || product.groupName;
      product.description = description || product.description;

      // Handle new image upload
      if (req.file) {
        if (product.filePath) {
          unlinkSync(product.filePath); // Delete old image if exists
        }
        product.filePath = req.file.path;
      }

      await product.save();

      res.status(200).json({
        status: true,
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      console.error("Failed to update product:", error);
      res
        .status(500)
        .json({ error: "Failed to update product. Please try again." });
    }
  });
}
