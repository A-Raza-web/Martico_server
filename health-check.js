// Server Health Check
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

console.log('🔍 SERVER HEALTH CHECK');
console.log('===================');
console.log('Environment Variables:');
console.log('- PORT:', process.env.PORT || 'Not set (default: 4000)');
console.log('- MONGO_URI:', process.env.MONGO_URI ? '✓ Set' : '❌ Not set');
console.log('- CLOUD_NAME:', process.env.CLOUD_NAME || '❌ Not set');
console.log('- CLOUD_API_KEY:', process.env.CLOUD_API_KEY || process.env.CLOUD_APL_KEY || '❌ Not set');
console.log('- CLOUD_API_SECRET:', process.env.CLOUD_API_SECRET ? '✓ Set' : '❌ Not set');

// Check if required dependencies are available
try {
  require('cloudinary');
  console.log('- Cloudinary: ✓ Available');
} catch (e) {
  console.log('- Cloudinary: ❌ Not available');
}

try {
  require('p-limit');
  console.log('- p-limit: ✓ Available');
} catch (e) {
  console.log('- p-limit: ❌ Not available');
}

// Test route imports
try {
  require('./routes/category');
  console.log('- Category routes: ✓ Available');
} catch (e) {
  console.log('- Category routes: ❌ Error -', e.message);
}

try {
  require('./routes/media');
  console.log('- Media routes: ✓ Available');
} catch (e) {
  console.log('- Media routes: ❌ Error -', e.message);
}

// Test utility imports
try {
  require('./utils/cloudinary');
  console.log('- Cloudinary utils: ✓ Available');
} catch (e) {
  console.log('- Cloudinary utils: ❌ Error -', e.message);
}

try {
  require('./utils/rateLimiter');
  console.log('- Rate limiter utils: ✓ Available');
} catch (e) {
  console.log('- Rate limiter utils: ❌ Error -', e.message);
}

console.log('\n📋 AVAILABLE ENDPOINTS:');
console.log('=====================');
console.log('GET    /api/categories - List all categories');
console.log('GET    /api/categories/:id - Get specific category');
console.log('POST   /api/categories/upload-image - Upload image to Cloudinary (Step 1)');
console.log('POST   /api/categories/create-with-image - Create category with Cloudinary URL (Step 2)');
console.log('POST   /api/categories/create - Legacy create (both steps combined)');
console.log('POST   /api/categories/batch - Create multiple categories with rate limiting');
console.log('PUT    /api/categories/:id - Update category with image replacement');
console.log('DELETE /api/categories/:id - Delete category with associated image');
console.log('POST   /api/categories/bulk-delete - Delete multiple categories with rate limiting');
console.log('GET    /api/categories/stats/count - Get category statistics');
console.log('');
console.log('POST   /api/media/upload/single - Upload single image');
console.log('POST   /api/media/upload/multiple - Upload multiple images');
console.log('POST   /api/media/batch - Batch operations with rate limiting');

console.log('\n✅ SERVER SETUP COMPLETE');
console.log('To start the server, run: npm start');
console.log('Make sure Node.js and MongoDB are properly installed.');