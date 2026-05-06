const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Category = require('../models/category');
const SubCategory = require('../models/subCat');
const { protect, admin } = require("../middleware/authMiddleware");
const { upload,CloudinaryUtils } = require('../utils/cloudinary');
const { rateLimiter } = require('../utils/rateLimiter');


// GET / -> list all products with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, inFeatured, search } = req.query;
    const subCategoryParam = req.query.subCategory || req.query.subcategory || req.query.subCat;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    
    // Handle category - can be either ID or name
    if (category) {
      // Check if it's a valid ObjectId or try to find by name
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      } else {
        // Try to find category by name
        const cat = await Category.findOne({ name: { $regex: new RegExp('^' + category + '$', 'i') } });
        if (cat) {
          filter.category = cat._id;
        }
      }
    }
    if (subCategoryParam) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(subCategoryParam)) {
        filter.subCategory = subCategoryParam;
      } else {
        const sub = await SubCategory.findOne({
          name: { $regex: new RegExp('^' + subCategoryParam + '$', 'i') }
        });
        if (sub) {
          filter.subCategory = sub._id;
        }
      }
    }
    if (inFeatured === 'true') filter.inFeatured = true;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter)
      .populate('category')
      .populate('subCategory')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /brands -> get all unique brands
router.get('/brands', async (req, res) => {
  try {
    const brands = await Product.distinct('brand');
    const filteredBrands = brands.filter(brand => brand && brand.trim() !== '');
    res.json({ success: true, data: filteredBrands });
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /:id -> get product by id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('subCategory');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create Product
router.post('/create', protect, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      images,
      brand,
      price,
      oldPrice,
      discount,
      category,
      subCategory,
      countInStock,
      rating,
      review,
      inFeatured
    } = req.body;

    // ---------------------------
    // Basic Validation
    // ---------------------------
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, price and category are required"
      });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required"
      });
    }

    // ---------------------------
    // Upload Images to Cloudinary
    // ---------------------------
    const uploadedImages = await Promise.all(
      images.map((img, index) =>
        CloudinaryUtils.uploadImage(
          img,
          `product_${Date.now()}_${index}`
        )
      )
    );

    const formattedImages = uploadedImages.map(img => ({
      url: img.url,
      public_id: img.public_id
    }));

    // ---------------------------
    // Price Handling
    // ---------------------------
    const numericPrice = parseFloat(price);
    const numericOldPrice = oldPrice ? parseFloat(oldPrice) : null;

    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price value"
      });
    }

    if (numericOldPrice && numericOldPrice < numericPrice) {
      return res.status(400).json({
        success: false,
        message: "Old price must be greater than current price"
      });
    }

    // ---------------------------
    // Discount Logic
    // ---------------------------
    let finalDiscount = 0;

    if (discount !== undefined) {
      const numericDiscount = parseFloat(discount);

      if (numericDiscount < 0 || numericDiscount > 100) {
        return res.status(400).json({
          success: false,
          message: "Discount must be between 0 and 100"
        });
      }

      finalDiscount = numericDiscount;
    } else if (numericOldPrice) {
      finalDiscount = Math.round(
        ((numericOldPrice - numericPrice) / numericOldPrice) * 100
      );
    }

    // ---------------------------
    // Create Product
    // ---------------------------
    const product = new Product({
      name,
      description,
      images: formattedImages,
      brand,
      price: numericPrice,
      oldPrice: numericOldPrice,
      discount: finalDiscount,
      category,
      subCategory: subCategory || null,
      countInStock: countInStock ? parseInt(countInStock) : 0,
      rating: rating ? parseFloat(rating) : 0,
      review: review ? (Array.isArray(review) ? review : [review]) : [],
      inFeatured: inFeatured === true || inFeatured === 'true'
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product
    });

  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// PUT /:id -> update a product
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { images, ...otherFields } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let updateData = { ...otherFields };

    // ✅ Agar new images aa rahi hain
    if (images && Array.isArray(images) && images.length > 0) {
      // Purani images delete karo Cloudinary se
      if (product.images && product.images.length > 0) {
        const oldPublicIds = product.images
          .filter(img => img.public_id)
          .map(img => img.public_id);
        if (oldPublicIds.length > 0) {
          await CloudinaryUtils.deleteMultipleImages(oldPublicIds);
        }
      }

      // Nee images upload karo Cloudinary par
      const uploadResults = await Promise.all(
        images.map((imgBase64, index) =>
          CloudinaryUtils.uploadImage(imgBase64, `product_${Date.now()}_${index}`)
        )
      );

      // Build images array with url and public_id
      updateData.images = uploadResults.map(res => ({
        url: res.url,
        public_id: res.public_id
      }));
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ success: true, data: updated });

  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// DELETE /:id -> delete a product
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Delete all images from Cloudinary
    if (product.images && product.images.length > 0) {
      const publicIds = product.images.map(img => img.public_id);
      if (publicIds.length > 0) await CloudinaryUtils.deleteMultipleImages(publicIds);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
