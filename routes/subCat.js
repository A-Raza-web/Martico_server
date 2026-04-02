// routes/subCategory.js

const express = require('express');
const router = express.Router();
const SubCategory = require('../models/subCat');


// ============================
// ✅ Create SubCategory
// ============================
router.post('/create', async (req, res) => {
  try {
    const { name, category } = req.body;

    const subCategory = new SubCategory({
      name,
      category
    });

    await subCategory.save();

    res.status(201).json({
      success: true,
      data: subCategory
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ============================
// ✅ Get All SubCategories
// ============================
router.get('/', async (req, res) => {
  try {
    const subCategories = await SubCategory.find()
      .populate('category');

    res.json({
      success: true,
      count: subCategories.length,
      data: subCategories
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// ============================
// ✅ Delete SubCategory
// ============================
router.delete('/:id', async (req, res) => {
  try {
    const subCategory = await SubCategory.findByIdAndDelete(req.params.id);

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'SubCategory not found'
      });
    }

    res.json({
      success: true,
      message: 'SubCategory deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;