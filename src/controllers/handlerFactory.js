const msg = require("../../languages/pt-BR.json");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

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

exports.sendResponse = (data, statusCode, res) =>
  sendResponse(data, statusCode, res);

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // Gambiarra pra funcionar o nested get reviews nos jobs;
    let nestedFilter = {};
    if (req.params.jobId) nestedFilter = { job: req.params.jobId };

    const features = new APIFeatures(Model.find(nestedFilter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    sendResponse(await features.query, 200, res);
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    if (!doc)
      return next(new AppError(msgRegisterNotFound(req.params.id), 404));

    sendResponse(doc, 200, res);
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    sendResponse(await Model.create(req.body), 201, res);
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc)
      return next(new AppError(msgRegisterNotFound(req.params.id), 404));

    sendResponse(doc, 200, res);
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc)
      return next(new AppError(msgRegisterNotFound(req.params.id), 404));

    sendResponse(null, 204, res);
  });
