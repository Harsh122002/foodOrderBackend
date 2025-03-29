import GroupItem from "../models/groupModal.js";
import upload from "../middleware/multerConfig.js";
import { unlinkSync, existsSync } from "fs";

export function addGroup(req, res) {
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

      const newGroup = new GroupItem({
        groupName,
        filePath,
      });

      await newGroup.save();
      res
        .status(200)
        .json({ message: "Group item added successfully", newGroup });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

export async function getAllGroups(req, res) {
  try {
    const groups = await GroupItem.find();
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function DeleteGroup(req, res) {
  try {
    const { id } = req.params;

    const group = await GroupItem.findById(id);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (GroupItem.filePath && existsSync(GroupItem.filePath)) {
      try {
        unlinkSync(GroupItem.filePath);
        console.log("File deleted:", GroupItem.filePath);
      } catch (fileError) {
        console.error("Error deleting file:", fileError.message);
      }
    } else {
      console.warn("File not found or invalid path:", GroupItem.filePath);
    }
    await GroupItem.findByIdAndDelete(id);
    res
      .status(200)
      .json({ message: "Group and associated image deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete group." });
  }
}

export async function UpdateGroupItem(req, res) {
  try {
    const { groupId } = req.body;

    const Group = await GroupItem.findOne({ _id: groupId });

    if (!Group) {
      return res.status(404).json({ message: "Group item not found" });
    }
    res
      .status(200)
      .json({ groupName: Group.groupName, filePath: Group.filePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function addUpdateGroup(req, res) {
  upload.single("imageFile")(req, res, async (err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Failed to upload image. Please try again." });
    }

    try {
      const { groupId, groupName } = req.body;
      const imageFile = req.file ? req.file.filename : null;

      const Group = await GroupItem.findById({ _id: groupId });
      if (!Group) {
        return res.status(404).json({ error: "Group not found" });
      }

      Group.groupName = groupName || Group.groupName;
      if (imageFile) {
        Group.imageFile = imageFile;
      }

      await Group.save();

      res
        .status(200)
        .json({ status: true, message: "Group updated successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to update group. Please try again." });
    }
  });
}
