const express = require("express");
const router = express.Router();
const MyList = require("../models/myListModel");

// ================================
// Add To My List
// ================================
router.post("/add", async (req, res) => {
  try {
    const { productId, userId, name, image, price, brand, category, newPrice } = req.body;

    if (!productId || !userId || !name || !image || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: "productId, userId, name, image, and price are required"
      });
    }

    const existingItem = await MyList.findOne({ productId, userId });

    if (existingItem) {
      existingItem.name = name;
      existingItem.image = image;
      existingItem.price = price;

      if (brand !== undefined) {
        existingItem.brand = brand;
      }
      if (category !== undefined) {
        existingItem.category = category;
      }
      if (newPrice !== undefined) {
        existingItem.newPrice = newPrice;
      }

      await existingItem.save();

      return res.json({
        success: true,
        message: "Product already in my list",
        data: existingItem
      });
    }

    const listItem = new MyList({
      productId,
      userId,
      name,
      image,
      price,
      brand,
      category,
      newPrice
    });

    await listItem.save();

    res.json({
      success: true,
      message: "Product added to my list",
      data: listItem
    });
  } catch (error) {
    console.error("My List Add Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================================
// Get User count of my list items
// ================================
router.get("/count/:userId", async (req, res) => {
  try {
    const count = await MyList.countDocuments({
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
// Get User My List
// ================================
router.get("/user/:userId", async (req, res) => {
  try {
    const listItems = await MyList.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: listItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================================
// Delete My List Item
// ================================
router.delete("/delete/:id", async (req, res) => {
  try {
    await MyList.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Item removed from my list"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
