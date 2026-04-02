const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  // Contact Info
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

  // Shipping Address
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

  // Delivery Type
  deliveryMethod: {
    type: String,
    enum: ["standard", "express"],
    default: "standard",
  },

  // Payment Method
  paymentMethod: {
    type: String,
    enum: ["card", "cod"],
    required: true,
  },

  // Cart Items
  items: [
    {
      productId: String,
      name: String,
      image: String,
      price: Number,
      quantity: Number,
    },
  ],

  // Pricing
  subtotal: Number,
  deliveryFee: Number,
  totalAmount: Number,

  // Notes
  orderNotes: String,

  // Order Status
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered"],
    default: "pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);