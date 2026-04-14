const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const Product = require("../models/product");
const Cart = require("../models/cartModel");
const Order = require("../models/order");

const stripe = new Stripe(process.env.YOUR_SECRET_KEY);

function generateOrderNumber() {
  const date = new Date();
  const timestamp = date.getTime().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

router.post("/checkout", async (req, res) => {
  try {
    const { items, userId, contact, shippingAddress, deliveryMethod, orderNotes } = req.body;

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const productData = await Product.findById(item.productId);
      
      if (!productData) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      subtotal += productData.price * item.quantity;
      validatedItems.push({
        productId: item.productId,
        name: productData.name,
        image: productData.image,
        price: productData.price,
        quantity: item.quantity,
      });
    }

    const deliveryFee = deliveryMethod === "express" ? 15 : 5;
    const totalAmount = subtotal + deliveryFee;

    const orderData = {
      userId,
      orderNumber: generateOrderNumber(),
      contact,
      shippingAddress,
      deliveryMethod: deliveryMethod || "standard",
      items: validatedItems,
      subtotal,
      deliveryFee,
      totalAmount,
      orderNotes,
    };

    const line_items = validatedItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: line_items,
      mode: "payment",
      success_url: "https://martico-client.vercel.app/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://martico-client.vercel.app/cancel",
      metadata: {
        orderData: JSON.stringify(orderData),
      },
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/confirm", async (req, res) => {
    const { sessionId, userId } = req.body;

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            // Find the order that was just paid using metadata
            const orderData = JSON.parse(session.metadata.orderData);
            
            // Ensure order has required fields for the database
            const orderToSave = {
              userId: orderData.userId,
              orderNumber: orderData.orderNumber || `ORD-${Date.now()}`,
              contact: orderData.contact,
              shippingAddress: orderData.shippingAddress,
              deliveryMethod: orderData.deliveryMethod || "standard",
              paymentMethod: "card",
              items: orderData.items || [],
              subtotal: orderData.subtotal || 0,
              deliveryFee: orderData.deliveryFee || 0,
              totalAmount: orderData.totalAmount || session.amount_total / 100,
              orderNotes: orderData.orderNotes,
              paymentStatus: "paid",
              fulfillmentStatus: "confirmed",
            };

            const newOrder = new Order(orderToSave);
            await newOrder.save();
            console.log("✅ Paid order saved to DB:", newOrder._id);

            await Cart.deleteMany({ userId: userId });
            res.status(200).json({ success: true, message: "Order saved and cart cleared", orderId: newOrder._id });
        } else {
            res.status(200).json({ success: true, message: "Payment not completed" });
        }
    } catch (error) {
        console.error("Confirm error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
