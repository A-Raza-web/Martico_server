const express = require('express');
const app = express();
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // JSON Base64 support
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes;
const homeBannerRoutes = require('./routes/homeBanner');
const searchRoute = require('./routes/searchRoute');
const categoryRoutes = require('./routes/category');
const productRoutes = require('./routes/product');
const subCategoryRoutes = require('./routes/subCat');
const authRouter =  require("./routes/authRoutes");
const cartRoutes = require('./routes/cartRoutes');
const myListRoutes = require("./routes/myListRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/payment");
const orderRoutes = require('./routes/order');
const webhookRoutes = require('./routes/webhookRoutes');

// Use routes;

app.use('/api/banners', homeBannerRoutes);
app.use('/api/search',  searchRoute);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subcategories', subCategoryRoutes);
app.use("/api/auth", authRouter);
app.use("/api/cart", cartRoutes);
app.use("/api/mylist", myListRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment/webhook", webhookRoutes);

const PORT = process.env.PORT;

// ✅ MongoDB connect;
let isConnected = false;

async function connectWithRetry(){
  await mongoose.connect(process.env.MONGO_URI, {})
    .then(() => {
      console.log("✅ MongoDB Connected");
      isConnected = true;
    })
    .catch(err => console.error("❌ MongoDB Connection Error:", err));
}
// add mongoose connection retry logic

app.use((req,res,next)=>{
  if(!isConnected){
    connectWithRetry()
  }
  next();
})

// app.listen(PORT, () => {
//   console.log(`🚀 Server listening on port ${PORT}!`);
//   console.log(`📊 Cloudinary configured for: ${process.env.CLOUD_NAME}`);
//   console.log(`⚡ p-limit concurrency control ready`);
// });

module.exports = app;