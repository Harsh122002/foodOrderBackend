const express = require("express");

const Order = require("../models/orderModal");

exports.OrderDetail = async (req, res) => {
  const orderData = req.body;
  try {
    const order = new Order(orderData);
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
