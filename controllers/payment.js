import razorpay from "../utils/razpay.js";
import crypto from "crypto";

// Payment Order Creation Controller
export async function Payment(req, res) {
  try {
    const { totalAmount, currency = "INR" } = req.body;

    console.log("Received payment creation request with data:", {
      totalAmount,
      currency,
    });

    // Convert totalAmount to a number and validate
    const amount = Number(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      console.error("Invalid amount received:", totalAmount);
      return res.status(400).json({ error: "Invalid amount provided" });
    }

    // Prepare order options
    const options = {
      amount: amount * 100, // Convert to paisa
      currency,
      receipt: `order_${Date.now()}`,
      payment_capture: 1, // Auto capture after successful payment
    };

    console.log("Creating Razorpay order with options:", options);

    // Create order
    const order = await razorpay.orders.create(options);
    console.log("Order created successfully:", order);

    // Respond with order details
    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
    });
  } catch (error) {
    console.error("Error while creating Razorpay order:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create Razorpay order",
      details: error.message, // Optional: include error details for debugging
    });
  }
}

export async function PaymentVerify(req, res) {
  try {
    const { orderId, paymentId, signature } = req.body;

    console.log("Received request to verify payment with:", {
      orderId,
      paymentId,
      signature,
    });

    const generatedSignature = crypto
      .createHmac("sha256", "YOUR_SECRET")
      .update(orderId + "|" + paymentId)
      .digest("hex");

    if (generatedSignature === signature) {
      // Payment verified successfully
      console.log("Payment verified successfully");
      res.status(200).json({ status: "success", orderId, paymentId });
    } else {
      // Invalid signature
      console.error("Invalid payment verification:", {
        orderId,
        paymentId,
        signature,
      });
      res
        .status(400)
        .json({ status: "failure", message: "Invalid payment verification" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error); // Log the entire error object
    res.status(500).json({ error: "Failed to verify payment" });
  }
}
