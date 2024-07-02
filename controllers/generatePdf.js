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
    console.log(`Output path for PDF: ${outputPath}`);

    // Generate the PDF
    await GeneratePDF(orderData, outputPath);

    // Check if the file exists before attempting to send it
    if (fs.existsSync(outputPath)) {
      console.log(`File exists at: ${outputPath}`);

      // Open the PDF in the browser
      res.setHeader("Content-Type", "application/pdf");
      res.sendFile(outputPath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          return res.status(500).send("Error sending file");
        } else {
          console.log("File sent successfully");
        }
      });
    } else {
      console.error(`File not found: ${outputPath}`);
      res.status(404).send("File not found");
    }
  } catch (error) {
    console.error("Error generating or sending PDF:", error);
    res.status(500).send("Error generating or sending PDF");
  }
};
