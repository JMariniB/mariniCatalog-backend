const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    amzorderid: {
      type: String,
      required:[true,"Please add an order ID"],
      unique: true,
      trime: true,
    },
    amzorderdate: {
      type: Date,
      required: [true, "Please add the Amz order date"],
    },
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    asin: {
      type: String,
      required: true,
      default: "##",
      trim: true,
    },
    location: {
        type: String,
        required: true,
        default: "PEND",
        trim: true,
      },
    quantity: {
      type: String,
      default:"0",
      trim: true,
    },
    price: {
      type: String,
      default:"1",
      trim: true,
    },
    description: {
      type: String,
      required: [false, "Please add a description"],
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    pendingPublish: {
      type: Boolean,
      default: false
    },
    image: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;