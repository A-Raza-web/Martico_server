const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Product = require("../models/Product");

// 1. GET reviews for a product
router.get("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 });

    res.json({ success: true, reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 2. POST a new review
router.post("/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, email, message, rating } = req.body;

    if (!message || !rating) {
      return res.status(400).json({ success: false, message: "Message and rating are required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const safeName = (name && String(name).trim()) || "Anonymous";
    const safeEmail = (email && String(email).trim()) || "anonymous@example.com";

    const newReview = new Review({
      product: productId,
      name: safeName,
      email: safeEmail,
      message,
      rating,
      avatar: `https://i.pravatar.cc/150?u=${safeName}`
    });

    await newReview.save();

    // Update product's average rating
    const allReviews = await Review.find({ product: productId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    product.rating = avgRating;
    product.reviewCount = allReviews.length;
    await product.save();

    res.json({ success: true, review: newReview, productRating: avgRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
