const express = require("express");
const Stripe = require("stripe");
const Order = require("../models/order");

const router = express.Router();
const stripe = new Stripe(process.env.YOUR_SECRET_KEY);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      try {
        const orderData = JSON.parse(session.metadata.orderData);

        const newOrder = new Order({
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
        });

        await newOrder.save();
        console.log("✅ Order saved in DB:", newOrder._id);
      } catch (err) {
        console.error("❌ Error saving order:", err);
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;