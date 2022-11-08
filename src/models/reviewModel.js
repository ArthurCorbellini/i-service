const mongoose = require("mongoose");
const msg = require("../../languages/pt-BR.json");
const Job = require("./jobModel");

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

// cria um index composto pelo atributo job e author, e seta como unique;
//   -> não permite inserção duplicada desses parâmetros);
reviewSchema.index({ job: 1, author: 1 }, { unique: true });

// método estático que calcula e salva a soma e a média dos ratings para cada job;
reviewSchema.statics.calcAverageRatings = async function (jobId) {
  const stats = await this.aggregate([
    {
      $match: { job: jobId },
    },
    {
      $group: {
        _id: "$job",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const anyResult = stats.length > 0;

  await Job.findByIdAndUpdate(jobId, {
    ratingsQuantity: anyResult ? stats[0].nRating : 0,
    ratingsAverage: anyResult ? stats[0].avgRating : null,
  });
};

// calcAverageRatings após o save;
reviewSchema.post("save", async function () {
  // mesma coisa que:
  //  -> const Review = mongoose.model("Review", reviewSchema);
  //  -> Review.calcAverageRatings(this.job);
  await this.constructor.calcAverageRatings(this.job);
});

// calcAverageRatings após update ou delete;
reviewSchema.post(/^findOneAnd/, async (doc) => {
  if (doc) await doc.constructor.calcAverageRatings(doc.job);
});

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
