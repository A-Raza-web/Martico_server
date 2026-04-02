const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    userId: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true
    },

    image: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true
    },

    quantity: {
        type: Number,
        default: 1
    },

    subtotal: {
        type: Number,
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);
