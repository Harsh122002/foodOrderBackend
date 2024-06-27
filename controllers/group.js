const jwt = require("jsonwebtoken");
const GroupItem = require("../models/groupModel");
const upload = require("../middleware/multerConfig");

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
