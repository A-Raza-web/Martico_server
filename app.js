require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'https://martico-admin.vercel.app',
  'http://localhost:5173', 
  'https://martico-client.vercel.app' 
];

// ================================
// Middlewares
// ================================

// 1. CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Policy Error'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// 2. Global OPTIONS Handler 
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================================
// Webhook (Must be before JSON parser)
// ================================
app.use('/api/payment/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/webhookRoutes')
);

// ================================
// MongoDB Connection (Serverless Safe)
// ================================
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGO_URI) throw new Error("❌ MONGO_URI missing in ENV");

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

app.get("/", (req, res) => {
  res.send("🚀 Martico API is running...");
});

module.exports = app;
