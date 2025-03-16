import GeneratePDF from "../utils/generatePDF.js";
import { join, dirname } from "path";
import { existsSync, mkdirSync, unlink } from "fs";
import { fileURLToPath } from "url";
import Order from "../models/orderModal.js";

// Getting the __dirname equivalent in ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

// Generate and Send PDF
export async function GeneratePdf(req, res) {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Order ID is required" });
  }

  try {
    // Fetch Order Data
    const orderData = await Order.findById(orderId);
    if (!orderData) {
      console.error(`Order with ID ${orderId} not found`);
      return res.status(404).json({ error: "Order not found" });
    }

    // Prepare output directory
    const outputDir = join(__dirname, "../pdf");
    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

    // Define output path
    const outputPath = join(outputDir, `${orderId}.pdf`);

    // Generate PDF
    await GeneratePDF(orderData, outputPath, orderId);
    console.log(`PDF generated at: ${outputPath}`);

    // Check if PDF exists before sending
    if (existsSync(outputPath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.sendFile(outputPath, (err) => {
        if (err) {
          console.error("Error sending PDF file:", err);
          return res.status(500).json({ error: "Error sending file" });
        }

        // Schedule file deletion after 1 min
        setTimeout(() => {
          unlink(outputPath, (err) => {
            if (err) console.error("Error deleting file:", err);
            else console.log(`Temporary PDF deleted: ${outputPath}`);
          });
        }, 60000); // 1 minute
      });
    } else {
      console.error("Generated PDF file not found");
      res.status(404).json({ error: "PDF file not found" });
    }
  } catch (error) {
    console.error("Error generating/sending PDF:", error);
    res.status(500).json({ error: "Failed to generate and send PDF" });
  }
}
