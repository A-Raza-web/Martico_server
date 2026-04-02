# Backend Server with Cloudinary and p-limit

This server demonstrates how to use Cloudinary for image management and p-limit for concurrency control.

## 🚀 Features

### Cloudinary Integration
- **Image Upload**: Single and multiple image uploads
- **Direct Upload**: Upload images directly without multer-storage-cloudinary
- **Image Management**: Delete images and get image information
- **Transformations**: Automatic image resizing and optimization

### p-limit Concurrency Control
- **Rate Limiting**: Control concurrent database operations
- **Batch Processing**: Process large datasets in controlled batches
- **API Calls**: Limit concurrent external API calls
- **File Processing**: Control concurrent file operations

## 📁 File Structure

```
server/
├── utils/
│   ├── cloudinary.js      # Cloudinary configuration and utilities
│   └── rateLimiter.js     # p-limit concurrency control utilities
├── routes/
│   ├── category.js        # Existing category routes
│   └── media.js           # Media upload and processing routes
├── app.js                 # Main server file
└── package.json           # Dependencies
```

## 🔧 Setup

1. **Environment Variables** (.env):
```env
PORT=3000
MONGO_URI=your_mongodb_uri
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_APL_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Start Server**:
```bash
npm start
```

## 🛠️ Usage Examples

### Cloudinary Endpoints

#### Single Image Upload
```bash
POST /api/media/upload/single
Content-Type: multipart/form-data
Body: image (file)
```

#### Multiple Images Upload
```bash
POST /api/media/upload/multiple
Content-Type: multipart/form-data
Body: images[] (files, max 10)
```

#### Direct Upload
```bash
POST /api/media/upload/direct
Content-Type: application/json
Body: {
  "imageBuffer": "base64_encoded_image",
  "fileName": "optional_filename"
}
```

#### Delete Image
```bash
DELETE /api/media/image/:publicId
```

#### Get Image Info
```bash
GET /api/media/image/:publicId/info
```

### p-limit Examples

#### Batch Product Creation
```bash
POST /api/media/products/batch
Content-Type: application/json
Body: {
  "products": [
    {"name": "Product 1", "price": 100},
    {"name": "Product 2", "price": 200}
  ]
}
```

#### Concurrent Processing Demo
```bash
POST /api/demo/concurrent-processing
Content-Type: application/json
Body: {
  "products": [...],
  "images": [...]
}
```

## ⚡ p-limit Configuration

The concurrency limit is set to **5** operations simultaneously. You can adjust this in `utils/rateLimiter.js`:

```javascript
const limit = pLimit(5); // Change this number to adjust concurrency
```

## 📊 Cloudinary Features

- **Automatic Optimization**: Images are automatically resized to 800x600 and optimized
- **Secure URLs**: All uploaded images use HTTPS
- **Folder Organization**: Images are stored in 'martico_products' folder
- **Format Support**: JPG, PNG, JPEG, WEBP formats supported

## 🔒 Error Handling

All endpoints include proper error handling:
- Validation of input data
- Graceful handling of Cloudinary errors
- Rate limiting error responses
- Detailed error messages

## 🧪 Testing

You can test the endpoints using tools like Postman or curl:

```bash
# Test server health
curl http://localhost:3000/

# Test concurrent processing
curl -X POST http://localhost:3000/api/demo/concurrent-processing \
  -H "Content-Type: application/json" \
  -d '{"products":[{"name":"Test Product","price":100}]}'
```

## 🚀 Production Ready

This setup is production-ready with:
- Environment variable configuration
- Proper error handling
- Concurrency control
- Security best practices
- Scalable architecture