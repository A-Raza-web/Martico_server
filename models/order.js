const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },

  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },

  contact: {
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },

  shippingAddress: {
    fullName: {
      type: String,
      required: true,
    },
    company: {
      type: String,
    },
    street: {
      type: String,
      required: true,
    },
    apartment: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    country: {
      type: String,
      required: true,
    },
  },

  deliveryMethod: {
    type: String,
    enum: ["standard", "express"],
    default: "standard",
  },

  paymentMethod: {
    type: String,
    enum: ["card", "cod"],
    required: true,
  },

  items: [
    {
      productId: String,
      name: String,
      image: String,
      price: Number,
      quantity: Number,
    },
  ],

  currency: {
    type: String,
    default: "USD",
  },

  subtotal: {
    type: Number,
    required: true,
  },

  deliveryFee: {
    type: Number,
    default: 0,
  },

  totalAmount: {
    type: Number,
    required: true,
  },

  orderNotes: String,

  paymentStatus: {
  type: String,
  enum: ["unpaid", "paid", "refunded", "pending"], 
  default: "unpaid",
},

  fulfillmentStatus: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    default: "pending",
  },

  trackingNumber: String,

  adminNotes: String,

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ fulfillmentStatus: 1 });
orderSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);