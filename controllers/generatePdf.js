const order = require("../models/orderModal");
const GeneratePDF = require("../utils/generatePDF");
const path = require("path");
const fs = require("fs");

exports.GeneratePdf = async (req, res) => {
  const { orderId } = req.body;

  try {
    const orderData = await order.findById(orderId);
    if (!orderData) {
      return res.status(404).send("Order not found");
    }

    const outputDir = path.join(__dirname, "../pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${orderId}.pdf`);

    await GeneratePDF(orderData, outputPath, orderId);

    if (fs.existsSync(outputPath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.sendFile(outputPath, (err) => {
        if (err) {
          return res.status(500).send("Error sending file");
        } else {
          setTimeout(() => {
            fs.unlink(outputPath, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }, 60000);
        }
      });
    } else {
      res.status(404).send("File not found");
    }
  } catch (error) {
    res.status(500).send("Error generating or sending PDF");
  }
};
