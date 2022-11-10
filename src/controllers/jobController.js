const msg = require("../../languages/pt-BR.json");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
const Job = require("../models/jobModel");
const AppError = require("../utils/appError");

exports.getAllJobs = factory.getAll(Job);
exports.getJob = factory.getOne(Job, { path: "reviews" });
exports.createJob = factory.createOne(Job);
exports.updateJob = factory.updateOne(Job);
exports.deleteJob = factory.deleteOne(Job);

exports.getJobsWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  if (!lat || !lng) next(new AppError(msg["error.latlngFormat"], 400));

  // raio da terra em milhas e quilômetros;
  const radius = unit === "mi" ? distance / 3958.8 : distance / 6370;
  const jobs = await Job.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  factory.sendResponse(jobs, 200, res);
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");

  if (!lat || !lng) next(new AppError(msg["error.latlngFormat"], 400));

  const distances = await Job.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        // o resultado vem em metros, por isso necessita desta conversão (em milhas ou quilômetros);
        distanceMultiplier: unit === "mi" ? 0.000621371 : 0.001,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  factory.sendResponse(distances, 200, res);
});
