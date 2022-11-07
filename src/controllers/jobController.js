const factory = require("./handlerFactory");
const Job = require("../models/jobModel");

exports.getAllJobs = factory.getAll(Job);
exports.getJob = factory.getOne(Job, { path: "reviews" });
exports.createJob = factory.createOne(Job);
exports.updateJob = factory.updateOne(Job);
exports.deleteJob = factory.deleteOne(Job);
