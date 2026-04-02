const  express = require ("express");
const  Stripe =require ("stripe");
const Order =  ("../models/order.js");

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

    // ✅ Payment successful
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const orderData = JSON.parse(session.metadata.orderData);

      const newOrder = new Order({
        ...orderData,
        paymentMethod: "card",
        status: "confirmed",
      });

      await newOrder.save();

      console.log("✅ Order saved in DB");
    }

    res.json({ received: true });
  }
);

module.exports = router;
