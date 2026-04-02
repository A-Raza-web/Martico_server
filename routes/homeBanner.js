const express = require("express");
const Banner = require("../models/homeBanner");
const { CloudinaryUtils } = require("../utils/cloudinary");

const router = express.Router();
/* =========================
   GET ALL BANNERS
========================= */
router.get("/", async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { image } = req.body;

    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    let updatedData = {};

    // agar new image ayi hai
    if (image) {
      // old delete
      if (banner.public_id) {
        await CloudinaryUtils.deleteImage(banner.public_id);
      }

      // new upload
      const result = await CloudinaryUtils.uploadImage(
        image,
        "banner_" + Date.now()
      );

      updatedData.image = result.url;
      updatedData.public_id = result.public_id;
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedBanner
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const result = await CloudinaryUtils.uploadImage(image, "banner_" + Date.now());

    const banner = new Banner({
      image: result.url,
      public_id: result.public_id
    });

    await banner.save();

    res.status(201).json(banner);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    // Cloudinary se delete
    if (banner.public_id) {
      await CloudinaryUtils.deleteImage(banner.public_id);
    }

    // MongoDB se delete
    await Banner.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;