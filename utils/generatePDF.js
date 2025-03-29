import PDFDocument from "pdfkit";
import { createWriteStream } from "fs";

async function GeneratePDF(orderData, outputPath, OrderId) {
  console.log(OrderId);
  try {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = createWriteStream(outputPath);
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
    const tableTop = doc.y;
    const columnSpacing = 150;
    const rowSpacing = 20;

    // Header
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Product", 50, tableTop);
    doc.text("Quantity", 200, tableTop);
    doc.text("Price", 300, tableTop);
    doc.text("Total", 400, tableTop);
    doc.moveDown();

    // Table Rows
    let currentYPosition = tableTop + rowSpacing;
    orderData.products.forEach((product) => {
      doc.font("Helvetica").fontSize(12);

      doc.text(product.name, 50, currentYPosition, { width: columnSpacing });
      doc.text(product.quantity.toString(), 200, currentYPosition, {
        width: columnSpacing,
        align: "left",
      });
      doc.text(`Rs. ${product.price.toFixed(2)}`, 300, currentYPosition, {
        width: columnSpacing,
        align: "left",
      });
      doc.text(
        `Rs. ${(product.price * product.quantity).toFixed(2)}`,
        400,
        currentYPosition,
        {
          width: columnSpacing,
          align: "left",
        }
      );

      currentYPosition += rowSpacing; // Move to the next row position
    });
   // Total Amount
   doc
   .font("Helvetica-Bold")
   .fontSize(14)
   .text(orderData.discountName?
     `Discount Name: Rs. ${orderData.discountName}`:"",
     50,
     currentYPosition + 20
    );
    doc
   .font("Helvetica-Bold")
   .fontSize(14)
   .text(orderData.discountPercentage?
     `Discount Percentage: Rs. ${orderData.discountPercentage}%`:"",
     50,
     currentYPosition + 40
    );
    doc
   .font("Helvetica-Bold")
   .fontSize(14)
   .text(
    orderData?.couponCode 
      ? `Coupon Code: ${orderData.couponCode}` 
      : '',
    50,
    currentYPosition + 60
  );
  
 doc.moveDown();
    // Total Amount
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(
        `Total Amount: Rs. ${orderData.totalAmount.toFixed(2)}`,
        50,
        currentYPosition + 80
      );
    doc.moveDown();

    // Payment Method
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(
        `Payment Method: ${orderData.paymentMethod}`,
        50,
        currentYPosition + 100
      );
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

export default GeneratePDF;
