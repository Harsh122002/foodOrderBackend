import GroupItem from "../models/groupModal.js";
import Order from "../models/orderModal.js";
import ProductItem from "../models/productModal.js";
import mailer from "../utils/mailer.js";
import User from "../models/userModal.js";
const { sendOrderConfirmation, deleteOrderConfirmation } = mailer;

export async function OrderDetail(req, res) {
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
}

export async function getAllOrder(req, res) {
  try {
    const { userId, page = 1, limit = 5 } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ userId });

    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const productDetails = await Promise.all(
          order.products.map(async (product) => {
            const productInfo = await ProductItem.findOne({
              productName: product.name,
            });

            return {
              name: product.name,
              quantity: product.quantity,
              price: product.price,
image: productInfo?.filePath || null
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
    const order = await Order.findById(orderId);
    const user = await User.findById(order.userId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = "declined";
    const updatedOrder = await order.save();
    deleteOrderConfirmation(user.email, updatedOrder.status);

    let message = "Order cancelled successfully.";
    if (order.paymentMethod === "online") {
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
}

export async function getAllPendingOrder(req, res) {
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
            const productDetails = await ProductItem.findOne({
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
    const { orderId, status, deliveryBoyName, boylatitude, boylongitude } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const user = await User.findById(order.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await sendOrderConfirmation(user.email, status);

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status,
        deliveryBoyName,
        boylatitude,
        boylongitude
      },
      { new: true }
    );

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error.message);
    res.status(500).json({ error: "Failed to update order status" });
  }
}


export async function getAllCompleteOrder(req, res) {
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
          const productDetails = await ProductItem.findOne({
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
          const productDetails = await ProductItem.findOne({
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
          const productDetails = await ProductItem.findOne({
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
    const [result] = await Order.aggregate([
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
    const order = await Order.findById({ _id: orderId });

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
    const completedOrders = await Order.find({ status: "completed" });
    const declinedOrders = await Order.find({ status: "declined" });

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

    processOrders(completedOrders, "completed");
    processOrders(declinedOrders, "declined");

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
    const completedOrders = await Order.find({ status: "completed" });
    const declinedOrders = await Order.find({ status: "declined" });

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



export const fetchOrderByBoyName = async (req, res) => {
  try {
    const { boyName } = req.body;

    if (!boyName) {
      return res.status(400).json({ message: "Delivery boy name is required" });
    }

    const orders = await Order.find({
      deliveryBoyName: boyName,
      status: "running",
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this delivery boy" });
    }

    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {

        // 🔍 Fetch user details by userId
        const user = await User.findById(order.userId);

        const enrichedProducts = await Promise.all(
          order.products.map(async (product) => {
            const productInfo = await ProductItem.findOne({ productName: product.name });

            return {
              name: product.name,
              quantity: product.quantity,
              price: product.price,
              filePath: productInfo?.filePath || null,
              totalPrice: product.quantity * product.price,
            };
          })
        );

        return {
          id: order._id,
          status: order.status,
          address: order.address,
          totalAmount: order.totalAmount,
          products: enrichedProducts,
          createdAt: order.createdAt,
          paymentMethod: order.paymentMethod,
          rating: order.rating || null,
          user: user ? {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.mobile,
          } : null
        };
      })
    );

    res.status(200).json(enrichedOrders);
  } catch (error) {
    console.error("Error fetching orders by delivery boy's name:", error);
    res.status(500).json({ error: "Failed to fetch orders by delivery boy's name" });
  }
};

export const AllCompletedOrderForUserId = async (req, res) => {
  try {
    const { deliveryBoyName } = req.body;

    if (!deliveryBoyName) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Get first day of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all completed orders for the current month
    const orders = await Order.find({
      deliveryBoyName,
      status: "completed",
      // createdAt: { $gte: startOfMonth }
    });

    // Filter cash payment orders
    const cashOrders = orders.filter(order => order.paymentMethod === "cash");

    // Calculate total cash income
    const totalCashIncome = cashOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.status(200).json({
      success: true,
      orders,
      totalCashIncome
    });

  } catch (error) {
    console.error("Error in AllCompletedOrderForUserId:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
