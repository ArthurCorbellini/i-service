const mongoose = require("mongoose");

const schema = mongoose.Schema({
  name: {
    type: String,
    required: [true, "name required!"],
    unique: true,
    trim: true,
  },
  duration: {
    type: Number,
    required: [true, "duration required!"],
  },
  maxGroupSize: {
    type: Number,
    required: [true, "maxGroupSize required!"],
  },
  difficulty: {
    type: String,
    required: [true, "difficulty required!"],
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
  },
  ratingQuantity: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, "price required!"],
  },
  priceDiscount: Number,
  summary: {
    type: String,
    trim: true,
    required: [true, "summary required!"],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, "imageCover required!"],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false, // nunca retorna essa variável no select
  },
  startDates: [Date],
});

module.exports = mongoose.model("Tour", schema);
