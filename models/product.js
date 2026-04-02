const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  // Product Name
  name: { 
    type: String, 
    required: [true, "Product name is required"], 
    trim: true 
  },

  // Product Description
  description: { 
    type: String, 
    trim: true 
  },

  // Multiple Images
  images: [
    {
      url: { type: String, required: [true, "Image URL is required"] },
      public_id: { type: String, required: [true, "Public ID is required"] }
    }
  ],

  // Brand Name
  brand: { 
    type: String, 
    trim: true 
  },

  // Current Price
  price: { 
    type: Number, 
    required: [true, "Price is required"], 
    min: [0, "Price cannot be negative"] 
  },

  // Old Price (Optional)
  oldPrice: {
    type: Number,
    min: [0, "Old Price cannot be negative"]
  },

  // Discount Percentage
  discount: {
    type: Number,
    min: [0, "Discount cannot be less than 0"],
    max: [100, "Discount cannot be more than 100"]
  },

  // Category Reference
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, "Category is required"]
  },

  // SubCategory Reference (Optional)
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  },

  // Stock Count
  countInStock: { 
    type: Number, 
    default: 0, 
    min: [0, "Stock cannot be negative"] 
  },

  // Rating (0 to 5)
  rating: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 5 
  },

  // Reviews Array (Just text, can expand to sub-documents)
  review: [{ 
    type: String, 
    trim: true 
  }],

  // Review Count
  reviewCount: { 
    type: Number, 
    default: 0 
  },

  // Featured Product Flag
  inFeatured: { 
    type: Boolean, 
    default: false 
  }

}, {
  timestamps: true // createdAt & updatedAt auto add
});


module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);