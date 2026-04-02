const mongoose = require("mongoose");

const myListSchema = new mongoose.Schema(
  {
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
    brand: {
      type: String
    },
    image: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    newPrice: {
      type: Number,
      min: 0
    },
    category: {
      type: String
    }
  },
  { timestamps: true }
);

myListSchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("MyList", myListSchema);
