const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// --------------------
// Cloudinary Config
// --------------------


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// --------------------
// Multer storage
// --------------------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'martico_products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});

const upload = multer({ storage });

// --------------------
// Class-based Utils
// --------------------
class CloudinaryUtils {
  // Single image upload (Buffer / Base64 / URL)
  static async uploadImage(fileInput, fileName) {
    try {
      let uploadData = fileInput;

      if (Buffer.isBuffer(fileInput)) {
        // Determine MIME type
        let mimeType = 'image/jpeg';
        if (fileInput.slice(0, 4).toString('hex').startsWith('89504e47')) mimeType = 'image/png';
        else if (fileInput.slice(0, 2).toString('hex') === 'ffd8') mimeType = 'image/jpeg';
        else if (fileInput.slice(0, 4).toString('hex').startsWith('474946')) mimeType = 'image/gif';
        else if (fileInput.slice(0, 4).toString('hex').startsWith('52494646')) mimeType = 'image/webp';

        const base64 = fileInput.toString('base64');
        uploadData = `data:${mimeType};base64,${base64}`;
      }

      const result = await cloudinary.uploader.upload(uploadData, {
        folder: 'martico_products',
        public_id: fileName,
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      return {
        url: result.secure_url,
        public_id: result.public_id
      };
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  // Multiple images upload
  static async uploadMultipleImages(files) {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const result = await cloudinary.uploader.upload(file.buffer, {
          folder: 'martico_products',
          public_id: `${Date.now()}_${index}`,
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });
        return {
          url: result.secure_url,
          public_id: result.public_id
        };
      });

      return Promise.all(uploadPromises);
    } catch (error) {
      throw new Error(`Cloudinary multiple upload failed: ${error.message}`);
    }
  }

  // Delete single image
  static async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
  }

  // Delete multiple images
  static async deleteMultipleImages(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      throw new Error(`Cloudinary multiple delete failed: ${error.message}`);
    }
  }

  // Get image info
  static async getImageInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      throw new Error(`Cloudinary get info failed: ${error.message}`);
    }
  }
}


// Export
module.exports = { upload, CloudinaryUtils };
