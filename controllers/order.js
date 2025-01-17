const Order = require("../models/orderModal");
const User = require("../models/userModel"); // Replace with your User model import
const {
  sendOrderConfirmation,
  deleteOrderConfirmation,
} = require("../utils/mailer");
const Product = require("../models/productModal");

exports.OrderDetail = async (req, res) => {
  const orderData = req.body;

  if (!orderData.address) {
    return res.status(400).json({
      message: "Address is required. Please provide a valid address.",
    });
  }

  try {
    const order = new Order(orderData);
    const user = await User.findById(order.userId);

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

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

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
              image: productInfo.filePath,
            };
          })
        );

        return {
          ...order._doc,
          products: productDetails,
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
  const { orderId } = req.body;

  try {
    const order = await Order.findById(orderId);
    const user = await User.findById(order.userId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = "declined";
    const updatedOrder = await order.save();
    deleteOrderConfirmation(user.email, updatedOrder.status);

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
    const [pendingOrders, runningOrders, completeOrders, declinedOrders] =
      await Promise.all([
        Order.find({ status: "pending" }),
        Order.find({ status: "running" }),
        Order.find({ status: "completed" }),
        Order.find({ status: "declined" }),
      ]);

    const orderStatuses = {
      pending: pendingOrders.length,
      running: runningOrders.length,
      completed: completeOrders.length,
      declined: declinedOrders.length,
    };

    res.status(200).json(orderStatuses);
  } catch (err) {
    console.error("Error fetching order statuses:", err);
    res.status(500).json({ error: "Failed to fetch order statuses" });
  }
};

exports.getAllPendingOrder = async (req, res) => {
  try {
    const pendingOrders = await Order.find({ status: "pending" });

    if (!pendingOrders || pendingOrders.length === 0) {
      return res.status(404).json({ message: "No pending orders found" });
    }

    const ordersWithUserDetails = await Promise.all(
      pendingOrders.map(async (order) => {
        const user = await User.findById(order.userId);

        if (!user) {
          return null;
        }

        const productsWithFilePath = await Promise.all(
          order.products.map(async (product) => {
            const productDetails = await Product.findOne({
              productName: product.name,
            });

            return {
              name: product.name,
              quantity: product.quantity,
              price: product.price,
              filePath: productDetails ? productDetails.filePath : null,
              totalPrice: product.quantity * product.price,
            };
          })
        );

        return {
          orderId: order.id,
          status: order.status,
          address: order.address,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          products: productsWithFilePath,
          user: {
            username: user.name,
            email: user.email,
          },
        };
      })
    );

    const validOrders = ordersWithUserDetails.filter((order) => order !== null);

    res.status(200).json(validOrders);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch pending orders with user details",
    });
  }
};

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
    const completedOrders = await Order.find({ status: "completed" });

    if (!completedOrders || completedOrders.length === 0) {
      return res.status(404).json({ message: "No completed orders found" });
    }

    let ordersWithUserDetails = [];

    for (let order of completedOrders) {
      const user = await User.findById(order.userId);

      if (!user) {
        console.error(`User not found for order ${order._id}`);
        continue;
      }

      const productsWithImages = await Promise.all(
        order.products.map(async (product) => {
          const productDetails = await Product.findOne({
            productName: product.name,
          });

          return {
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            totalPrice: product.quantity * product.price,
            filePath: productDetails ? productDetails.filePath : null,
          };
        })
      );

      const orderWithUser = {
        orderId: order.id,
        status: order.status,
        address: order.address,
        totalAmount: order.totalAmount,
        products: productsWithImages,
        paymentMethod: order.paymentMethod,
        user: {
          username: user.name,
          email: user.email,
        },
      };

      ordersWithUserDetails.push(orderWithUser);
    }

    res.status(200).json(ordersWithUserDetails);
  } catch (error) {
    console.error("Error fetching completed orders with user details:", error);
    res.status(500).json({
      error: "Failed to fetch completed orders with user details",
    });
  }
};

exports.getAllRunningOrder = async (req, res) => {
  try {
    const runningOrders = await Order.find({ status: "running" });

    if (!runningOrders || runningOrders.length === 0) {
      return res.status(404).json({ message: "No running orders found" });
    }

    let ordersWithUserDetails = [];

    for (let order of runningOrders) {
      const user = await User.findById(order.userId);

      if (!user) {
        console.error(`User not found for order ${order._id}`);
        continue;
      }

      const productsWithImages = await Promise.all(
        order.products.map(async (product) => {
          const productDetails = await Product.findOne({
            productName: product.name,
          });

          return {
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            totalPrice: product.quantity * product.price,
            filePath: productDetails ? productDetails.filePath : null,
          };
        })
      );

      const orderWithUser = {
        orderId: order.id,
        status: order.status,
        address: order.address,
        totalAmount: order.totalAmount,
        products: productsWithImages,
        paymentMethod: order.paymentMethod,
        user: {
          username: user.name,
          email: user.email,
        },
      };

      ordersWithUserDetails.push(orderWithUser);
    }

    res.status(200).json(ordersWithUserDetails);
  } catch (error) {
    console.error("Error fetching running orders with user details:", error);
    res.status(500).json({
      error: "Failed to fetch running orders with user details",
    });
  }
};

exports.getAllDeclinedOrder = async (req, res) => {
  try {
    const declinedOrders = await Order.find({ status: "declined" });

    if (!declinedOrders || declinedOrders.length === 0) {
      return res.status(404).json({ message: "No declined orders found" });
    }

    let ordersWithUserDetails = [];

    for (let order of declinedOrders) {
      const user = await User.findById(order.userId);

      if (!user) {
        console.error(`User not found for order ${order._id}`);
        continue;
      }

      const productsWithImages = await Promise.all(
        order.products.map(async (product) => {
          const productDetails = await Product.findOne({
            productName: product.name,
          });

          return {
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            totalPrice: product.quantity * product.price,
            filePath: productDetails ? productDetails.filePath : null,
          };
        })
      );

      const orderWithUser = {
        orderId: order.id,
        status: order.status,
        address: order.address,
        totalAmount: order.totalAmount,
        products: productsWithImages,
        paymentMethod: order.paymentMethod,
        user: {
          username: user.name,
          email: user.email,
        },
      };

      ordersWithUserDetails.push(orderWithUser);
    }

    res.status(200).json(ordersWithUserDetails);
  } catch (error) {
    console.error("Error fetching declined orders with user details:", error);
    res.status(500).json({
      error: "Failed to fetch declined orders with user details",
    });
  }
};

exports.getAllPaymentAmount = async (req, res) => {
  try {
    const [result] = await Order.aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);

    res.status(200).json(result ? result.totalAmount : 0);
  } catch (error) {
    console.error("Error calculating total payment amount:", error);
    res.status(500).json({ error: "Failed to calculate total payment amount" });
  }
};

exports.updateRating = async (req, res) => {
  const { orderId, rating, description } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.rating = rating;
    order.ratingDescription = description;

    order.status = "completed";

    await order.save();

    return res.status(200).json({ message: "Rating updated successfully" });
  } catch (error) {
    console.error("Error updating rating:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
