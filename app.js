const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ================================
// Initialize app
// ================================
const app = express();

const allowedOrigins = [
  'https://martico-admin-git-main-a-raza-webs-projects.vercel.app',
  'http://localhost:5173', 
  'https://martico-client.vercel.app' 
];

// ================================
// Middlewares
// ================================
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(new Error('CORS Policy Error'), false);
        }
        return callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200 
}));



app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ================================
// Webhook (Serverless-safe)
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

// Connect DB on each request
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
app.use("/api", require('./routes/order'));
// ================================
// Default Route
// ================================
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// ================================
// Export app (Serverless Ready)
// ================================
module.exports = app;
