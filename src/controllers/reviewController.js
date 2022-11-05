const msg = require("../../languages/pt-BR.json");
const catchAsync = require("../utils/catchAsync");
const Review = require("../models/reviewModel");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");

const sendResponse = (data, statusCode, res) => {
  res.status(statusCode).json({
    status: "success",
    results: data != null && Array.isArray(data) ? data.length : undefined,
    data: {
      data,
    },
  });
};

const msgRegisterNotFound = (id) =>
  msg["error.registerNotFoundWithId"].replace("{{id}}", id);

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let nestedFilter = {};
  if (req.params.jobId) nestedFilter = { job: req.params.jobId };

  const features = new APIFeatures(Review.find(nestedFilter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  sendResponse(await features.query, 200, res);
});

exports.getReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review)
    return next(new AppError(msgRegisterNotFound(req.params.id), 404));
  sendResponse(review, 200, res);
});

exports.createReview = catchAsync(async (req, res, next) => {
  // caso vier do .../jobs/:jobId/reviews;
  if (!req.body.job) req.body.job = req.params.jobId;
  if (!req.body.author) req.body.author = req.user.id;
  sendResponse(await Review.create(req.body), 201, res);
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!review)
    return next(new AppError(msgRegisterNotFound(req.params.id), 404));
  sendResponse(review, 200, res);
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review)
    return next(new AppError(msgRegisterNotFound(req.params.id), 404));
  sendResponse(null, 204, res);
});
