import GeneratePDF from "../utils/generatePDF.js";
import { join } from "path";
import { existsSync, mkdirSync, unlink } from "fs";

export async function GeneratePdf(req, res) {
  const { orderId } = req.body;

  try {
    const orderData = await findById(orderId);
    if (!orderData) {
      return res.status(404).send("Order not found");
    }

    const outputDir = join(__dirname, "../pdf");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = join(outputDir, `${orderId}.pdf`);

    await GeneratePDF(orderData, outputPath, orderId);

    if (existsSync(outputPath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.sendFile(outputPath, (err) => {
        if (err) {
          return res.status(500).send("Error sending file");
        } else {
          setTimeout(() => {
            unlink(outputPath, (err) => {
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
}
