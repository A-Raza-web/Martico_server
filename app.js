require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ================================
// Initialize app
// ================================
const app = express();

const allowedOrigins = [
  'https://martico-admin.vercel.app',
  'http://localhost:5173', 
  'https://martico-client.vercel.app' 
];

// ================================
// Middlewares
// ================================

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy Error: Origin not allowed'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// 2. Global OPTIONS Handler
app.options('(.*)', cors());

app.use('/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/webhookRoutes')
);

// 4. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================================
// MongoDB Connection (Vercel/Serverless Optimized)
// ================================
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI missing in Environment Variables");
    throw new Error("MONGO_URI is not defined");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
    });
    cached.conn = conn;
    console.log("✅ MongoDB Connected Successfully");
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    throw error;
  }
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Database connection failed",
      error: err.message 
    });
  }
});

// ================================
// Routes
// ================================
app.use('/api/banners', require('./routes/homeBanner'));
app.use('/api/search', require('./routes/searchRoute'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/products', require('./routes/product'));
app.use('/api/subcategories', require('./routes/subCat'));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/cart", require('./routes/cartRoutes'));
app.use("/api/mylist", require("./routes/myListRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/payment", require('./routes/payment'));
app.use("/api/orders", require('./routes/order'));

// Default Route
app.get("/", (req, res) => {
  res.send("🚀 Martico API is running smoothly...");
});

// ================================
// Export app
// ================================
module.exports = app;
