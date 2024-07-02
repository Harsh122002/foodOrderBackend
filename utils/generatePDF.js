const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

async function GeneratePDF(orderData, outputPath, OrderId) {
  console.log(OrderId);
  try {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("Place Your Order", { align: "center" });

    // Order ID
    doc.moveDown();
    doc.font("Helvetica-Bold").fontSize(14).text(`Order ID: ${OrderId}`);
    doc.moveDown();

    // Customer Information
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("Customer Information", { underline: true });
    doc.moveDown();
    doc.font("Helvetica").fontSize(12);
    doc.text(`Name: ${orderData.name}`);
    doc.text(`Address: ${orderData.address}`);
    doc.text(`Mobile Number: ${orderData.mobileNumber}`);
    doc.moveDown();

    // Products
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("Products", { underline: true });
    doc.moveDown();

    // Table Header
    // Table Header
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Product", 30, doc.y, { width: 200, continued: true });
    doc.text("Quantity", 130, doc.y, { width: 100, continued: true });
    doc.text("Price", 180, doc.y, { width: 100, continued: true });
    doc.text("Total", 290, doc.y, { width: 100, continued: true });
    doc.moveDown();

    // Table Rows
    orderData.products.forEach((product) => {
      doc.font("Helvetica").fontSize(12);
      doc.text(product.name, 30, doc.y, { width: 200, continued: true });
      doc.text(product.quantity.toString(), 130, doc.y, {
        width: 100,
        continued: true,
      });
      doc.text(`Rs. ${product.price}`, 180, doc.y, {
        width: 100,
        continued: true,
      });
      doc.text(`Rs. ${product.price * product.quantity}`, 290, doc.y, {
        width: 100,
        continued: true,
      });
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
