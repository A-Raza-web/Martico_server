const express  = require("express");
const router   = express.Router();
const Product  = require("../models/Product");
const Category = require("../models/category");
// get route for search 
router.get("/", async (req, res) => {
  try {
    const query = req.query.q;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query required"
      });
    }

    const regex = new RegExp(query, "i");

    // 🔍 Find matching categories
    
    const categories = await Category.find({
      name: { $regex: regex }
    });

    const categoryIds = categories.map(cat => cat._id);

    // 🔍 Find products
    const products = await Product.find({
      $or: [
        { name: regex },
        { brand: regex },
        { category: { $in: categoryIds } }
      ]
    }).populate("category");

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;