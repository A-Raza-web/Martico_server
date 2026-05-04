const express = require("express");
const router = express.Router();
const { signup, signin} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { protect } = require("../middleware/authMiddleware");
const { upload, CloudinaryUtils } = require("../utils/cloudinary");
const User = require("../models/User");


router.post("/signin", signin);
router.post("/signup", signup);

// --------------------
// Update profile details
// --------------------

router.put("/update-profile/:userId", protect,  async (req, res) => {
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
