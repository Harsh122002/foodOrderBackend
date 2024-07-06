const jwt = require("jsonwebtoken");
const GroupItem = require("../models/groupModel");
const upload = require("../middleware/multerConfig");
const fs = require("fs"); // Node.js file system module for file operations

exports.addGroupItem = (req, res) => {
  upload.single("imageFile")(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { groupName } = req.body;
      const filePath = req.file.path;
      console.log("file", req.file); // Log the file information for debugging

      const newGroupItem = new GroupItem({
        groupName,
        filePath,
      });

      await newGroupItem.save();
      res
        .status(201)
        .json({ message: "Group item added successfully", newGroupItem });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};
exports.getAllGroupItems = async (req, res) => {
  try {
    const groupItems = await GroupItem.find();
    res.status(200).json(groupItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.DeleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Group ID to delete:", id);

    // Fetch the group item to get the image file path
    const groupItem = await GroupItem.findById(id);
    if (!groupItem) {
      return res.status(404).json({ message: "Group not found." });
    }

    // Delete the associated image file (if it exists)
    if (groupItem.filePath) {
      fs.unlinkSync(groupItem.filePath); // Delete the file synchronously
    }

    // Delete the group item from the database
    const deletedGroup = await GroupItem.findByIdAndDelete(id);
    if (deletedGroup) {
      res
        .status(200)
        .json({ message: "Group and associated image deleted successfully." });
    } else {
      res.status(404).json({ message: "Group not found." });
    }
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ message: "Failed to delete group." });
  }
};
