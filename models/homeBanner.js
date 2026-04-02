const mongoose =require("mongoose");

const bannerSchema = new mongoose.Schema({
  image: {
    type: String, // Cloudinary URL
    required: true
  },
  public_id: {
    type: String // Cloudinary delete/update ke liye
  }
}, { timestamps: true });

module.exports = mongoose.model("Banner", bannerSchema);