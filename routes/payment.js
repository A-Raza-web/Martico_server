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
      
      const mainImage = productData.images && productData.images.length > 0 
        ? productData.images[0].url 
        : "https://via.placeholder.com/150";

      validatedItems.push({
        productId: item.productId,
        name: productData.name,
        image: mainImage, 
        price: productData.price,
        quantity: item.quantity,
      });
    }

    const deliveryFee = deliveryMethod === "express" ? 15 : 5;
    const totalAmount = subtotal + deliveryFee;

    const newOrder = new Order({
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
      paymentMethod: "card", 
      paymentStatus: "unpaid", 
     });

    const savedOrder = await newOrder.save();

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
        orderId: savedOrder._id.toString(),
        userId: userId
      },
    });

    res.json({ url: session.url });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/confirm", async (req, res) => {
    const { sessionId } = req.body;

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            const orderId = session.metadata.orderId;
            const userId = session.metadata.userId;

            const updatedOrder = await Order.findByIdAndUpdate(orderId, {
                paymentStatus: "paid",
                fulfillmentStatus: "confirmed"
            }, { new: true });

            console.log("✅ Order updated to Paid:", orderId);

            await Cart.deleteMany({ userId: userId });
            
            res.status(200).json({ 
                success: true, 
                message: "Order updated and cart cleared", 
                orderId: updatedOrder._id 
            });
        } else {
            res.status(400).json({ success: false, message: "Payment not completed" });
        }
    } catch (error) {
        console.error("Confirm error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
