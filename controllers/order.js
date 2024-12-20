const Order = require("../models/orderModal");
const User = require("../models/userModel"); // Replace with your User model import
const {
  sendOrderConfirmation,
  deleteOrderConfirmation,
} = require("../utils/mailer");
const Product = require("../models/productModal");
exports.OrderDetail = async (req, res) => {
  const orderData = req.body;

  // Validate address
  if (!orderData.address) {
    return res.status(400).json({
      message: "Address is required. Please provide a valid address.",
    });
  }

  try {
    const order = new Order(orderData);
    const user = await User.findById(order.userId);

    // Assuming sendOrderConfirmation is an email sending function
    sendOrderConfirmation(user.email, order.status);

    const savedOrder = await order.save();

    res.status(201).json({
      message: "Order placed successfully",
      orderId: savedOrder._id,
    });
  } catch (error) {
    console.error("Error saving order:", error);
    res.status(500).json({
      message: "Failed to place order",
      error: error.message,
    });
  }
};

exports.getAllOrder = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch and sort orders in descending order based on 'createdAt'
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    // Retrieve product details for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const productDetails = await Promise.all(
          order.products.map(async (product) => {
            const productInfo = await Product.findOne({
              productName: product.name,
            });

            return {
              name: product.name,
              quantity: product.quantity,
              price: product.price,
              image: productInfo.filePath, // Assuming 'image' is a field in your Product model
            };
          })
        );

        return {
          ...order._doc, // Spread the original order fields
          products: productDetails, // Add the populated product details
        };
      })
    );

    if (!ordersWithDetails || ordersWithDetails.length === 0) {
      return res.status(404).json({ message: "Orders not found" });
    }

    res.status(200).json(ordersWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.OrderDelete = async (req, res) => {
  const { orderId } = req.body; // Assuming orderId is passed as a parameter

  try {
    // Find the order by orderId
    const order = await Order.findById(orderId);
    const user = await User.findById(order.userId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update the order status to "declined"
    order.status = "declined";
    const updatedOrder = await order.save();
    deleteOrderConfirmation(user.email,updatedOrder.status )

    // Determine the payment mode and customize the message
    let message = "Order cancelled successfully.";
    if (order.paymentMode === "online") {
      message += " You will receive a refund within 7 days.";
    }

    res.status(200).json({
      message: message,
      order: updatedOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllOrderStatuses = async (req, res) => {
  try {
    // Fetch all order statuses concurrently
    const [pendingOrders, runningOrders, completeOrders, declinedOrders] =
      await Promise.all([
        Order.find({ status: "pending" }),
        Order.find({ status: "running" }),
        Order.find({ status: "completed" }),
        Order.find({ status: "declined" }),
      ]);

    // Construct response object
    const orderStatuses = {
      pending: pendingOrders.length,
      running: runningOrders.length,
      completed: completeOrders.length,
      declined: declinedOrders.length,
    };

    // Send response
    res.status(200).json(orderStatuses);
  } catch (err) {
    console.error("Error fetching order statuses:", err);
    res.status(500).json({ error: "Failed to fetch order statuses" });
  }
};

exports.getAllPendingOrder = async (req, res) => {
  try {
    // Find all pending orders
    const pendingOrders = await Order.find({ status: "pending" });

    // If no pending orders found, return an empty response
    if (!pendingOrders || pendingOrders.length === 0) {
      return res.status(404).json({ message: "No pending orders found" });
    }

    // Prepare an array to store detailed order information with user details
    let ordersWithUserDetails = [];

    // Loop through each pending order and fetch user details
    for (let order of pendingOrders) {
      const user = await User.findById(order.userId); // Assuming userId is used to reference users

      // If user not found (which ideally shouldn't happen), skip this order or handle accordingly
      if (!user) {
        continue; // Skip this order if user is not found
      }

      // Construct order object with user details
      const orderWithUser = {
        orderId: order._id,
        status: order.status,
        address: order.address,
        totalAmount: order.totalAmount, // Grand total of the order
        products: order.products.map((product) => ({
          name: product.name,
          quantity: product.quantity,
          price: product.price,
          totalPrice: product.quantity * product.price,
        })),
        paymentMethod: order.paymentMethod,
        // Add other order details as needed
        user: {
          username: user.name,
          email: user.email,
          // Add other user details as needed
        },
      };

      ordersWithUserDetails.push(orderWithUser);
    }

    // Return the array of orders with user details
    res.status(200).json(ordersWithUserDetails);
  } catch (error) {
    console.error("Error fetching pending orders with user details:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch pending orders with user details" });
  }
};
// In your order controller
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findById(orderId);
    const user = await User.findById(order.userId);
    sendOrderConfirmation(user.email, status);
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};
exports.getAllCompleteOrder = async (req, res) => {
  try {
    // Find all completed orders
    const completedOrders = await Order.find({ status: "completed" });

    // If no completed orders found, return an empty response
    if (!completedOrders || completedOrders.length === 0) {
      return res.status(404).json({ message: "No completed orders found" });
    }

    // Prepare an array to store detailed order information with user details
    let ordersWithUserDetails = [];

    // Loop through each completed order and fetch user details
    for (let order of completedOrders) {
      const user = await User.findById(order.userId); // Assuming userId is used to reference users

      // If user not found, log an error and skip this order
      if (!user) {
        console.error(`User not found for order ${order._id}`);
        continue; // Skip this order if user is not found
      }

      // Construct order object with user details
      const orderWithUser = {
        orderId: order.id,
        status: order.status,
        address: order.address,
        totalAmount: order.totalAmount, // Grand total of the order
        products: order.products.map((product) => ({
          name: product.name,
          quantity: product.quantity,
          price: product.price,
          totalPrice: product.quantity * product.price,
        })),
        paymentMethod: order.paymentMethod,
        user: {
          username: user.name,
          email: user.email,
          // Add other user details as needed
        },
      };

      ordersWithUserDetails.push(orderWithUser);
    }

    // Return the array of orders with user details
    res.status(200).json(ordersWithUserDetails);
  } catch (error) {
    console.error("Error fetching completed orders with user details:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch completed orders with user details" });
  }
};

exports.getAllRunningOrder = async (req, res) => {
  try {
    // Find all pending orders
    const pendingOrders = await Order.find({ status: "running" });

    // If no pending orders found, return an empty response
    if (!pendingOrders || pendingOrders.length === 0) {
      return res.status(404).json({ message: "No pending orders found" });
    }

    // Prepare an array to store detailed order information with user details
    let ordersWithUserDetails = [];

    // Loop through each pending order and fetch user details
    for (let order of pendingOrders) {
      const user = await User.findById(order.userId); // Assuming userId is used to reference users

      // If user not found (which ideally shouldn't happen), skip this order or handle accordingly
      if (!user) {
        continue; // Skip this order if user is not found
      }

      // Construct order object with user details
      const orderWithUser = {
        orderId: order._id,
        status: order.status,
        address: order.address,
        totalAmount: order.totalAmount, // Grand total of the order
        products: order.products.map((product) => ({
          name: product.name,
          quantity: product.quantity,
          price: product.price,
          totalPrice: product.quantity * product.price,
        })),
        paymentMethod: order.paymentMethod,
        // Add other order details as needed
        user: {
          username: user.name,
          email: user.email,
          // Add other user details as needed
        },
      };

      ordersWithUserDetails.push(orderWithUser);
    }

    // Return the array of orders with user details
    res.status(200).json(ordersWithUserDetails);
  } catch (error) {
    console.error("Error fetching pending orders with user details:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch pending orders with user details" });
  }
};
exports.getAllDeclinedOrder = async (req, res) => {
  try {
    // Find all pending orders
    const pendingOrders = await Order.find({ status: "declined" });

    // If no pending orders found, return an empty response
    if (!pendingOrders || pendingOrders.length === 0) {
      return res.status(404).json({ message: "No pending orders found" });
    }

    // Prepare an array to store detailed order information with user details
    let ordersWithUserDetails = [];

    // Loop through each pending order and fetch user details
    for (let order of pendingOrders) {
      const user = await User.findById(order.userId); // Assuming userId is used to reference users

      // If user not found (which ideally shouldn't happen), skip this order or handle accordingly
      if (!user) {
        continue; // Skip this order if user is not found
      }

      // Construct order object with user details
      const orderWithUser = {
        orderId: order._id,
        status: order.status,
        address: order.address,
        totalAmount: order.totalAmount, // Grand total of the order
        products: order.products.map((product) => ({
          name: product.name,
          quantity: product.quantity,
          price: product.price,
          totalPrice: product.quantity * product.price,
        })),
        paymentMethod: order.paymentMethod,
        // Add other order details as needed
        user: {
          username: user.name,
          email: user.email,
          // Add other user details as needed
        },
      };

      ordersWithUserDetails.push(orderWithUser);
    }

    // Return the array of orders with user details
    res.status(200).json(ordersWithUserDetails);
  } catch (error) {
    console.error("Error fetching pending orders with user details:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch pending orders with user details" });
  }
};

exports.getAllPaymentAmount = async (req, res) => {
  try {
    // Aggregation pipeline to calculate the total amount
    const [result] = await Order.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);

    // Return only the total amount in the response
    res.status(200).json(result ? result.totalAmount : 0);
  } catch (error) {
    console.error("Error calculating total payment amount:", error);
    res.status(500).json({ error: "Failed to calculate total payment amount" });
  }
};

exports.updateRating = async (req, res) => {
  const { orderId, rating, description } = req.body; // Destructure from the request body

  try {
    // Find the order by its ID
    const order = await Order.findById(orderId);

    if (!order) {
      // If no order was found, return an error response
      return res.status(404).json({ message: "Order not found" });
    }

    // Update the rating and description
    order.rating = rating;
    order.ratingDescription = description;

    order.status = "completed";

    // Save the updated order
    await order.save();

    // Successfully updated
    return res.status(200).json({ message: "Rating updated successfully" });
  } catch (error) {
    console.error("Error updating rating:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
