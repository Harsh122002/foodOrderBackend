const jwt = require("jsonwebtoken");
const GroupItem = require("../models/groupModel");
const upload = require("../middleware/multerConfig");
const fs = require("fs");

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

    const groupItem = await GroupItem.findById(id);
    if (!groupItem) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (groupItem.filePath) {
      fs.unlinkSync(groupItem.filePath);
    }

    const deletedGroup = await GroupItem.findByIdAndDelete(id);
    if (deletedGroup) {
      res
        .status(200)
        .json({ message: "Group and associated image deleted successfully." });
    } else {
      res.status(404).json({ message: "Group not found." });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to delete group." });
  }
};

exports.UpdateGroupItem = async (req, res) => {
  try {
    const { groupId } = req.body;

    const groupItem = await GroupItem.findOne({ _id: groupId });
    
    if (!groupItem) {
      return res.status(404).json({ message: "Group item not found" });
    }
    res.status(200).json({ groupName: groupItem.groupName, filePath: groupItem.filePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addUpdateGroupItem = (req, res) => {
  upload.single("imageFile")(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to upload image. Please try again." });
    }

    try {
      const { groupId, groupName } = req.body;
      const imageFile = req.file ? req.file.filename : null;

      const groupItem = await GroupItem.findById({ _id: groupId });
      if (!groupItem) {
        return res.status(404).json({ error: "Group not found" });
      }

      groupItem.groupName = groupName || groupItem.groupName;
      if (imageFile) {
        groupItem.imageFile = imageFile;
      }

      await groupItem.save();

      res.status(200).json({ status: true, message: "Group updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update group. Please try again." });
    }
  });
};
