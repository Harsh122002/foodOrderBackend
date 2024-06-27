const multer = require("multer");
const path = require("path");

// Set up storage engine

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "groups/"); // Set your upload directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append the file extension
  },
});

// Initialize upload
// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 100000000 }, // 1MB file size limit
//   fileFilter: function (req, file, cb) {
//     checkFileType(file, cb);
//   },
// }).single("file");

// Check file type
// function checkFileType(file, cb) {
//   const filetypes = /jpeg|jpg|png|gif|pdf/;
//   const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = filetypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb("Error: Images and PDFs Only!");
//   }
// }

const upload = multer({ storage: storage });

module.exports = upload;
