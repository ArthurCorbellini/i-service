const factory = require("./handlerFactory");
const Review = require("../models/reviewModel");

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

// caso vir do .../jobs/:jobId/reviews;
exports.setJobUserIds = (req, res, next) => {
  if (!req.body.job) req.body.job = req.params.jobId;
  if (!req.body.author) req.body.author = req.user.id;
  next();
};
