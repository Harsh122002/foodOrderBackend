import Order from "../models/orderModal.js";
import mailer from "../utils/mailer.js";
const { sendOrderConfirmation, deleteOrderConfirmation } = mailer;
import moment from "moment"; // Install moment.js for date manipulation

export async function OrderDetail(req, res) {
  const orderData = req.body;

  if (!orderData.address) {
    return res.status(400).json({
      message: "Address is required. Please provide a valid address.",
    });
  }

  try {
    const order = new Order(orderData);
    const user = await _findById(order.userId);

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
}

export async function getAllOrder(req, res) {
  try {
    const { userId, page = 1, limit = 5 } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const skip = (page - 1) * limit;

    const orders = await find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await countDocuments({ userId });

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const productDetails = await Promise.all(
          order.products.map(async (product) => {
            const productInfo = await findOne({
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

    res.status(200).json({
      orders: ordersWithDetails,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export async function OrderDelete(req, res) {
  const { orderId } = req.body;

  try {
    const order = await findById(orderId);
    const user = await _findById(order.userId);
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
}

export async function getAllOrderStatuses(req, res) {
  try {
    const [pendingOrders, runningOrders, completeOrders, declinedOrders] =
      await Promise.all([
        find({ status: "pending" }),
        find({ status: "running" }),
        find({ status: "completed" }),
        find({ status: "declined" }),
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
}

export async function getAllPendingOrder(req, res) {
  try {
    const pendingOrders = await find({ status: "pending" });

    if (!pendingOrders || pendingOrders.length === 0) {
      return res.status(404).json({ message: "No pending orders found" });
    }

    const ordersWithUserDetails = await Promise.all(
      pendingOrders.map(async (order) => {
        const user = await _findById(order.userId);

        if (!user) {
          return null;
        }

        const productsWithFilePath = await Promise.all(
          order.products.map(async (product) => {
            const productDetails = await findOne({
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
          added: order.createdAt,
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
}

export async function updateOrderStatus(req, res) {
  try {
    const { orderId, status } = req.body;
    const order = await findById(orderId);
    const user = await _findById(order.userId);
    sendOrderConfirmation(user.email, status);
    const allDeliveryBoy = await _find({
      role: "delivery",
      status: "online",
    });
    console.log(allDeliveryBoy);

    const updatedOrder = await findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
}

export async function getAllCompleteOrder(req, res) {
  try {
    const completedOrders = await find({ status: "completed" });

    if (!completedOrders || completedOrders.length === 0) {
      return res.status(404).json({ message: "No completed orders found" });
    }

    let ordersWithUserDetails = [];

    for (let order of completedOrders) {
      const user = await _findById(order.userId);

      if (!user) {
        console.error(`User not found for order ${order._id}`);
        continue;
      }

      const productsWithImages = await Promise.all(
        order.products.map(async (product) => {
          const productDetails = await findOne({
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
        added: order.createdAt,
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
}

export async function getAllRunningOrder(req, res) {
  try {
    const runningOrders = await find({ status: "running" });

    if (!runningOrders || runningOrders.length === 0) {
      return res.status(404).json({ message: "No running orders found" });
    }

    let ordersWithUserDetails = [];

    for (let order of runningOrders) {
      const user = await _findById(order.userId);

      if (!user) {
        console.error(`User not found for order ${order._id}`);
        continue;
      }

      const productsWithImages = await Promise.all(
        order.products.map(async (product) => {
          const productDetails = await findOne({
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
        added: order.createdAt,
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
}

export async function getAllDeclinedOrder(req, res) {
  try {
    const declinedOrders = await find({ status: "declined" });

    if (!declinedOrders || declinedOrders.length === 0) {
      return res.status(404).json({ message: "No declined orders found" });
    }

    let ordersWithUserDetails = [];

    for (let order of declinedOrders) {
      const user = await _findById(order.userId);

      if (!user) {
        console.error(`User not found for order ${order._id}`);
        continue;
      }

      const productsWithImages = await Promise.all(
        order.products.map(async (product) => {
          const productDetails = await findOne({
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
        added: order.createdAt,
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
}

export async function getAllPaymentAmount(req, res) {
  try {
    const [result] = await aggregate([
      { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } },
    ]);

    res.status(200).json(result ? result.totalAmount : 0);
  } catch (error) {
    console.error("Error calculating total payment amount:", error);
    res.status(500).json({ error: "Failed to calculate total payment amount" });
  }
}

export async function updateRating(req, res) {
  const { orderId, rating, description } = req.body;

  try {
    const order = await findById(orderId);

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
}

export async function getMonthlyCompleteOrder(req, res) {
  try {
    const completedOrders = await find({ status: "completed" });
    const declinedOrders = await find({ status: "declined" });

    if (
      (!completedOrders || completedOrders.length === 0) &&
      (!declinedOrders || declinedOrders.length === 0)
    ) {
      return res
        .status(404)
        .json({ message: "No completed or declined orders found" });
    }

    // Initialize an empty object to store data by month
    const monthlyData = {};

    // Helper function to process orders
    const processOrders = (orders, status) => {
      for (let order of orders) {
        const orderMonth = moment(order.createdAt).format("YYYY-MM"); // Get month in YYYY-MM format

        // Check if the month already exists in the monthlyData object
        if (!monthlyData[orderMonth]) {
          monthlyData[orderMonth] = {
            completedOrders: 0,
            declinedOrders: 0,
          };
        }

        if (status === "completed") {
          monthlyData[orderMonth].completedOrders += 1;
        } else if (status === "declined") {
          monthlyData[orderMonth].declinedOrders += 1;
        }
      }
    };

    // Process completed and declined orders
    processOrders(completedOrders, "completed");
    processOrders(declinedOrders, "declined");

    // Prepare data for the chart (format it as an array of months and values)
    const chartData = Object.keys(monthlyData).map((month) => ({
      month,
      completedOrders: monthlyData[month].completedOrders,
      declinedOrders: monthlyData[month].declinedOrders,
    }));

    res.status(200).json({ data: chartData });
  } catch (error) {
    console.error(
      "Error fetching completed and declined orders monthly data:",
      error
    );
    res.status(500).json({
      error: "Failed to fetch completed and declined orders monthly data",
    });
  }
}
export async function getMonthlyOrderAmounts(req, res) {
  try {
    const completedOrders = await find({ status: "completed" });
    const declinedOrders = await find({ status: "declined" });

    if (
      (!completedOrders || completedOrders.length === 0) &&
      (!declinedOrders || declinedOrders.length === 0)
    ) {
      return res
        .status(404)
        .json({ message: "No completed or declined orders found" });
    }

    const monthlyData = {};

    const processOrders = (orders, status) => {
      for (let order of orders) {
        const orderMonth = moment(order.createdAt).format("YYYY-MM");

        if (!monthlyData[orderMonth]) {
          monthlyData[orderMonth] = {
            completedOrderAmount: 0,
            declinedOrderAmount: 0,
          };
        }

        if (status === "completed") {
          monthlyData[orderMonth].completedOrderAmount += order.totalAmount;
        } else if (status === "declined") {
          monthlyData[orderMonth].declinedOrderAmount += order.totalAmount;
        }
      }
    };

    processOrders(completedOrders, "completed");
    processOrders(declinedOrders, "declined");

    const chartData = Object.keys(monthlyData).map((month) => ({
      month,
      completedOrderAmount: monthlyData[month].completedOrderAmount,
      declinedOrderAmount: monthlyData[month].declinedOrderAmount,
    }));

    res.status(200).json({ data: chartData });
  } catch (error) {
    console.error(
      "Error fetching completed and declined orders monthly amounts:",
      error
    );
    res.status(500).json({
      error: "Failed to fetch completed and declined orders monthly amounts",
    });
  }
}
