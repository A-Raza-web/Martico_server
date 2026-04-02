const express = require('express');
const router = express.Router();
const Cart = require('../models/cartModel');


// ================================
// Add To Cart
// ================================
router.post('/add', async (req, res) => {
  try {
    const { productId, userId, name, image, price, quantity } = req.body;

    if (!productId || !userId || !name || !image || !price) {
      return res.status(400).json({
        success: false,
        message: "productId, userId, name, image, and price are required"
      });
    }

    // 1️⃣ Check if product already exists in cart
    const existingItem = await Cart.findOne({ productId, userId });

    if (existingItem) {
      // ✅ Increase quantity instead of blocking
      existingItem.quantity += quantity || 1;

      // update subtotal
      existingItem.subtotal = existingItem.price * existingItem.quantity;

      await existingItem.save();

      return res.json({
        success: true,
        message: "Product quantity updated in cart",
        data: existingItem
      });
    }

    // 2️⃣ If product not in cart → create new item
    const subtotal = price * (quantity || 1);

    const cartItem = new Cart({
      productId,
      userId,
      name,
      image,
      price,
      quantity: quantity || 1,
      subtotal
    });

    await cartItem.save();

    res.json({
      success: true,
      message: "Product added to cart",
      data: cartItem
    });

  } catch (error) {
    console.error("Cart Add Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================================
// Get User count of card items
// ================================

router.get("/count/:userId", async (req, res) => {
  try {

    const count = await Cart.countDocuments({
      userId: req.params.userId
    });

    res.json({
      success: true,
      count: count
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
});

// ================================
// Get User Cart
// ================================
router.get('/user/:userId', async (req, res) => {

    try {

        const cartItems = await Cart.find({
            userId: req.params.userId
        });

        res.json({
            success: true,
            data: cartItems
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


// ================================
// Delete Cart Item
// ================================
router.delete('/delete/:id', async (req, res) => {

    try {

        await Cart.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Item removed from cart"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

});


module.exports = router; 