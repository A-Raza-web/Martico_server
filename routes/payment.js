const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const Product = require("../models/product"); 
const Cart = require("../models/cartModel");

const stripe = new Stripe(process.env.YOUR_SECRET_KEY);

router.post("/checkout", async (req, res) => {
    try {
        const { items } = req.body;

        const line_items = await Promise.all(items.map(async (item) => {
            const productData = await Product.findById(item.productId);
            
            if (!productData) {
                throw new Error(`Product not found: ${item.productId}`);
            }

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: productData.name, 
                        images: [productData.image], 
                    },
                    unit_amount: Math.round(productData.price * 100), 
                },
                quantity: item.quantity || 1,
            };
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: line_items,
            mode: "payment",
            success_url: "https://martico-client.vercel.app/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "https://martico-client.vercel.app/cancel",
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
            
            await Cart.deleteMany({ userId: userId });

            res.status(200).json({ success: true, message: "Cart cleared" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;