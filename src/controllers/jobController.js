const msg = require("../../languages/pt-BR.json");
const catchAsync = require("../utils/catchAsync");
const Job = require("../models/jobModel");
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

exports.getAllJobs = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Job.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  sendResponse(await features.query, 200, res);
});

exports.getJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate("reviews");
  if (!job) return next(new AppError(msgRegisterNotFound(req.params.id), 404));
  sendResponse(job, 200, res);
});

exports.createJob = catchAsync(async (req, res, next) => {
  sendResponse(await Job.create(req.body), 201, res);
});

exports.updateJob = catchAsync(async (req, res, next) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!job) return next(new AppError(msgRegisterNotFound(req.params.id), 404));
  sendResponse(job, 200, res);
});

exports.deleteJob = catchAsync(async (req, res, next) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job) return next(new AppError(msgRegisterNotFound(req.params.id), 404));
  sendResponse(null, 204, res);
});
