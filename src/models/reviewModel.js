const mongoose = require("mongoose");
const msg = require("../../languages/pt-BR.json");

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, msg["vld.required"].replace("{{field}}", "review")],
    },
    rating: {
      type: Number,
      required: [true, msg["vld.required"].replace("{{field}}", "rating")],
      min: [
        1,
        msg["vld.min"]
          .replace("{{field}}", "rating")
          .replace("{{value}}", "1.0"),
      ],
      max: [
        5,
        msg["vld.max"]
          .replace("{{field}}", "rating")
          .replace("{{value}}", "5.0"),
      ],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    job: {
      type: mongoose.Schema.ObjectId,
      ref: "Job",
      required: [true, msg["vld.required"].replace("{{field}}", "job")],
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, msg["vld.required"].replace("{{field}}", "author")],
    },
  },
  {
    toJSON: { virtuals: true },
    toOject: { virtuals: true },
  }
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "author",
    select: "name photo",
  });
  // .populate({
  //   path: "job",
  //   select: "name",
  // });
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
