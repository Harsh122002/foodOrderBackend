import GeneratePDF from "../utils/generatePDF.js";
import Order from "../models/orderModal.js";

// Generate and send PDF as a Buffer (works on Vercel)
export async function GeneratePdf(req, res) {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }

  try {
    const orderData = await Order.findById(orderId);
    if (!orderData) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Generate PDF as buffer
    const pdfBuffer = await GeneratePDF(orderData); // <-- must return a buffer

    // Send PDF as response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${orderId}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generating/sending PDF:", error);
    res.status(500).json({ error: "Failed to generate and send PDF" });
  }
}
