const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function GeneratePDF(orderData, outputPath) {
  try {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("Place Your Order", { align: "center" });

    // Customer Information
    doc.moveDown();
    doc.font("Helvetica").fontSize(12);
    doc.text(`Name: ${orderData.name}`);
    doc.text(`Address: ${orderData.address}`);
    doc.text(`Mobile Number: ${orderData.mobileNumber}`);
    doc.moveDown();

    // Products
    doc.font("Helvetica-Bold").fontSize(18).text("Products");
    doc.moveDown();
    orderData.products.forEach((product) => {
      doc.text(`Product: ${product.name}`);
      doc.text(`Quantity: ${product.quantity}`);
      doc.text(`Price: Rs. ${product.price}`);
      doc.text(`Total: Rs. ${product.price * product.quantity}`);
      doc.moveDown();
    });

    // Total Amount
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`Total Amount: Rs. ${orderData.totalAmount}`);
    doc.moveDown();

    // Payment Method
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`Payment Method: ${orderData.paymentMethod}`);
    doc.moveDown();

    // Finalize PDF and close the stream
    doc.end();

    console.log(`PDF generated successfully at ${outputPath}`);
    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve(outputPath));
      stream.on("error", (err) => reject(err));
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

module.exports = GeneratePDF;
