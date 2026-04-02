const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  image: [{ type: String, trim: true }], // Array of image URLs
  name: { type: String, required: true, trim: true },
  color: { type: String, trim: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', CategorySchema);
