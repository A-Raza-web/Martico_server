const express = require('express');
const router = express.Router();
const Order = require('../models/order')

router.post("/create-order", async (req, res) => {
  try {
    const newOrder = new Order(req.body);
    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error placing order",
      error: error.message,
    });
  }
});


module.exports = router;
