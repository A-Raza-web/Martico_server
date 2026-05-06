const express = require("express");
const router = express.Router();
const { signup, signin } = require("../controllers/authController");
const { protect, admin: adminOnly } = require("../middleware/authMiddleware"); 
const User = require("../models/User");

// Public Routes
router.post("/signin", signin);
router.post("/signup", signup);

// ---------------------------------------------------------
// Admin Route: Get All Customers (For Customers Page)
// ---------------------------------------------------------
router.get("/admin/customers", protect, adminOnly, async (req, res) => {
  try {
    const { q } = req.query; 

    let filter = { role: "user" };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ];
    }

    const customers = await User.find(filter)
      .select("-password") 
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    console.error("Admin Customers Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching customers" });
  }
});

// --------------------
// Update profile details
// --------------------
router.put("/update-profile/:userId", protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email, phone, city, country, address, profileImage } = req.body;

    if (!name && !email && !phone && !city && !country && !address && !profileImage) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(city && { city }),
        ...(country && { country }),
        ...(address && { address }),
        ...(profileImage && { profileImage })
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
