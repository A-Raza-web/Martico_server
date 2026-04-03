const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// ================================
// Webhook (IMPORTANT - before json)
// ================================
app.use('/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/webhookRoutes')
);

// ================================
// Middlewares
// ================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ================================
// MongoDB Connection (Serverless Safe)
// ================================
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!process.env.MONGO_URI) {
    throw new Error("❌ MONGO_URI missing in ENV");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });

    cached.conn = conn;
    console.log("✅ MongoDB Connected");
    return conn;

  } catch (error) {
    console.error("❌ MongoDB Error:", error);
    throw error;
  }
}

// ہر request سے پہلے DB connect
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: "Database connection failed" });
  }
});

// ================================
// Routes
// ================================
const homeBannerRoutes = require('./routes/homeBanner');
const searchRoute = require('./routes/searchRoute');
const categoryRoutes = require('./routes/category');
const productRoutes = require('./routes/product');
const subCategoryRoutes = require('./routes/subCat');
const authRouter = require("./routes/authRoutes");
const cartRoutes = require('./routes/cartRoutes');
const myListRoutes = require("./routes/myListRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const paymentRoutes = require("./routes/payment");
const orderRoutes = require('./routes/order');

app.use('/api/banners', homeBannerRoutes);
app.use('/api/search', searchRoute);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subcategories', subCategoryRoutes);
app.use("/api/auth", authRouter);
app.use("/api/cart", cartRoutes);
app.use("/api/mylist", myListRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/orders", orderRoutes);

// ================================
// Default Route
// ================================
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// ================================
// Export
// ================================
module.exports = app;