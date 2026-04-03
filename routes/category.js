const express = require('express');
const router = express.Router();
const Category = require('../models/category');
const { CloudinaryUtils }  = require('../utils/cloudinary');
const pLimit = require('p-limit').default;



// GET / -> list all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



// POST /api/categories/create
router.post('/create', async (req, res) => {
  try {
    const { name, color, image } = req.body;

    if (!image || !name) return res.status(400).json({ message: "Missing fields" });

    const images = Array.isArray(image) ? image : [image];

    // Dynamic import of p-limit
    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(2);

    const uploadPromises = images.map((img, index) =>
      limit(async () => {
        const result = await CloudinaryUtils.uploadImage(img, `category_${Date.now()}_${index}`);
        return result.url;
      })
    );

    const imgUrls = await Promise.all(uploadPromises);

    const newCategory = new Category({
      name,
      color: color || '#ffffff',
      image: imgUrls
    });

    const savedCategory = await newCategory.save();

    res.status(201).json({ success: true, data: savedCategory });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const limit = pLimit(2);
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Update simple fields
    if (req.body.name) category.name = req.body.name;
    if (req.body.color) category.color = req.body.color;

    // Update images
    if (req.body.image && Array.isArray(req.body.image)) {
      const images = req.body.image;

      // Delete old images from Cloudinary if they exist
      if (category.image?.length) {
        const publicIds = category.image.map(url => {
          const parts = url.split('/');
          return parts[parts.length - 1].split('.')[0]; // get filename without extension
        });
        for (const id of publicIds) {
          await CloudinaryUtils.deleteImage(`martico_products/${id}`);
        }
      }

      // Upload new images to Cloudinary
      const uploadPromises = images.map((img, index) =>
        limit(async () => {
          if (img.startsWith('data:image/')) {
            const result = await CloudinaryUtils.uploadImage(img, `category_${Date.now()}_${index}`);
            return result.url;
          }
          // Already URL → keep as is
          return img;
        })
      );

      category.image = await Promise.all(uploadPromises);
    }

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error("PUT /categories/:id error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Get the category
    const categoryToDelete = await Category.findById(categoryId);
    if (!categoryToDelete) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Delete images from Cloudinary
    if (categoryToDelete.image && categoryToDelete.image.length > 0) {
      const publicIds = categoryToDelete.image.map(imgUrl => {
        const parts = imgUrl.split('/');
        const filename = parts[parts.length - 1]; // example: category_1770877620083_1.png
        return `martico_products/${filename.split('.')[0]}`; // include folder
      });

      // Delete all images
      await Promise.all(
        publicIds.map(async (publicId) => {
          try {
            await CloudinaryUtils.deleteImage(publicId);
            console.log('Deleted image:', publicId);
          } catch (err) {
            console.warn('Failed to delete image:', publicId, err.message);
          }
        })
      );
    }

    // Delete category from MongoDB
    const removed = await Category.findByIdAndDelete(categoryId);

    res.json({
      success: true,
      message: 'Category and associated images deleted successfully',
      data: removed
    });

  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



module.exports = router;
