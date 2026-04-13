const express = require("express");
const router = express.Router();
const Order = require("../models/order");
const Product = require("../models/product");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/authAdmin");

function generateOrderNumber() {
  const date = new Date();
  const timestamp = date.getTime().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

async function validateAndComputeTotals(items, deliveryMethod) {
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    subtotal += product.price * item.quantity;
    validatedItems.push({
      productId: item.productId,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity: item.quantity,
    });
  }

  const deliveryFee = deliveryMethod === "express" ? 15 : 5;
  const totalAmount = subtotal + deliveryFee;

  return { validatedItems, subtotal, deliveryFee, totalAmount };
}

router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { contact, shippingAddress, deliveryMethod, paymentMethod, items, orderNotes } = req.body;

    if (!contact || !shippingAddress || !paymentMethod || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const { validatedItems, subtotal, deliveryFee, totalAmount } = await validateAndComputeTotals(items, deliveryMethod);

    const order = new Order({
      userId,
      orderNumber: generateOrderNumber(),
      contact,
      shippingAddress,
      deliveryMethod,
      paymentMethod,
      items: validatedItems,
      subtotal,
      deliveryFee,
      totalAmount,
      orderNotes,
      paymentStatus: "unpaid",
      fulfillmentStatus: "pending",
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("List orders error:", error);
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ success: false, message: "Error fetching order" });
  }
});

router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (order.fulfillmentStatus === "shipped" || order.fulfillmentStatus === "delivered") {
      return res.status(400).json({ success: false, message: "Cannot cancel shipped or delivered order" });
    }

    order.fulfillmentStatus = "cancelled";
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ success: false, message: "Error cancelling order" });
  }
});

router.get("/admin/orders", adminOnly, async (req, res) => {
  try {
    const { status, q, from, to, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};

    if (status) {
      filter.fulfillmentStatus = status;
    }

    if (q) {
      filter.$or = [
        { orderNumber: { $regex: q, $options: "i" } },
        { "contact.email": { $regex: q, $options: "i" } },
        { "contact.phone": { $regex: q, $options: "i" } },
      ];
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin list orders error:", error);
    res.status(500).json({ success: false, message: "Error fetching orders" });
  }
});

router.get("/admin/orders/:id", adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Admin get order error:", error);
    res.status(500).json({ success: false, message: "Error fetching order" });
  }
});

router.patch("/admin/orders/:id", adminOnly, async (req, res) => {
  try {
    const { fulfillmentStatus, trackingNumber, adminNotes, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (fulfillmentStatus) order.fulfillmentStatus = fulfillmentStatus;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (adminNotes !== undefined) order.adminNotes = adminNotes;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    res.json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Admin update order error:", error);
    res.status(500).json({ success: false, message: "Error updating order" });
  }
});

router.post("/create-order", async (req, res) => {
  try {
    const { userId, contact, shippingAddress, deliveryMethod, paymentMethod, items, subtotal, deliveryFee, totalAmount, orderNotes } = req.body;

    if (items && items.length > 0) {
      const { validatedItems, subtotal: calcSubtotal, deliveryFee: calcDeliveryFee, totalAmount: calcTotal } = await validateAndComputeTotals(items, deliveryMethod || "standard");
      
      const newOrder = new Order({
        userId,
        orderNumber: generateOrderNumber(),
        contact,
        shippingAddress,
        deliveryMethod: deliveryMethod || "standard",
        paymentMethod,
        items: validatedItems,
        subtotal: calcSubtotal,
        deliveryFee: calcDeliveryFee,
        totalAmount: calcTotal,
        orderNotes,
        paymentStatus: paymentMethod === "card" ? "unpaid" : "unpaid",
        fulfillmentStatus: "pending",
      });

      await newOrder.save();

      return res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order: newOrder,
      });
    }

    const newOrder = new Order({
      userId,
      orderNumber: generateOrderNumber(),
      contact,
      shippingAddress,
      deliveryMethod: deliveryMethod || "standard",
      paymentMethod,
      items: [],
      subtotal: subtotal || 0,
      deliveryFee: deliveryFee || 0,
      totalAmount: totalAmount || 0,
      orderNotes,
      paymentStatus: "unpaid",
      fulfillmentStatus: "pending",
    });

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