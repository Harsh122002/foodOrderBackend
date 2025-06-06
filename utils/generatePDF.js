import PDFDocument from "pdfkit";
import { WritableStreamBuffer } from "stream-buffers";

async function GeneratePDF(orderData, OrderId) {
  try {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const streamBuffer = new WritableStreamBuffer();

    doc.pipe(streamBuffer);

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("HR FOOD-JUNAGADH.", { align: "center" });

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

    const tableTop = doc.y;
    const columnSpacing = 150;
    const rowSpacing = 20;

    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Product", 50, tableTop);
    doc.text("Quantity", 200, tableTop);
    doc.text("Price", 300, tableTop);
    doc.text("Total", 400, tableTop);
    doc.moveDown();

    let currentYPosition = tableTop + rowSpacing;
    orderData.products.forEach((product) => {
      doc.font("Helvetica").fontSize(12);
      doc.text(product.name, 50, currentYPosition);
      doc.text(`${product.quantity}`, 200, currentYPosition);
      doc.text(`Rs. ${product.price.toFixed(2)}`, 300, currentYPosition);
      doc.text(
        `Rs. ${(product.price * product.quantity).toFixed(2)}`,
        400,
        currentYPosition
      );
      currentYPosition += rowSpacing;
    });

    // Discount Info
    if (orderData.discountName) {
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(`Discount Name: ${orderData.discountName}`, 50, currentYPosition + 20);
    }

    if (orderData.discountPercentage) {
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(`Discount Percentage: ${orderData.discountPercentage}%`, 50, currentYPosition + 40);
    }

    if (orderData.couponCode) {
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .text(`Coupon Code: ${orderData.couponCode}`, 50, currentYPosition + 60);
    }

    // Total & Payment
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`Total Amount: Rs. ${orderData.totalAmount.toFixed(2)}`, 50, currentYPosition + 80);

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(`Payment Method: ${orderData.paymentMethod}`, 50, currentYPosition + 100);

    // Finalize PDF
    doc.end();

    return new Promise((resolve, reject) => {
      streamBuffer.on("finish", () => {
        const buffer = streamBuffer.getContents();
        resolve(buffer);
      });
      streamBuffer.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}

export default GeneratePDF;
