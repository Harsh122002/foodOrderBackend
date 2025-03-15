import  razorpay  from "../utils/razpay.js";

console.log("Imported Razorpay instance:", razorpay);

export async function Payment(req, res) {
  try {
    const { totalAmount, currency } = req.body;

    console.log("Received request to create payment with:", {
      totalAmount,
      currency,
    });

    // Convert totalAmount to a number
    const amount = Number(totalAmount);

    // Validate the amount
    if (isNaN(amount) || amount <= 0) {
      console.error("Invalid amount provided:", totalAmount);
      return res.status(400).json({ error: "Invalid amount provided" });
    }

    const options = {
      amount: amount * 100, // amount in paisa
      currency: "INR",
      receipt: `order_${Date.now()}`,
      payment_capture: 1,
    };

    console.log("Creating order with options:", options);

    // Create the order and log the response
    const response = await razorpay.orders.create(options);
    console.log("Order created successfully:", response);

    res.status(200).json({
      orderId: response.id,
      amount: response.amount,
      currency: response.currency,
    });
  } catch (error) {
    console.error("Error creating order:", error); // Log the entire error object
    res.status(500).json({ error: "Failed to create order" });
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
