const msg = require("../../languages/pt-BR.json");
const catchAsync = require("../utils/catchAsync");
const Job = require("../models/jobModel");

exports.getOverview = catchAsync(async (req, res) => {
  res.status(200).render("overview", {
    title: msg["label.allJobs"],
    jobs: await Job.find(),
  });
});

exports.getJob = catchAsync(async (req, res) => {
  const job = await Job.findById(req.params.id).populate({
    path: "reviews",
    fields: "review rating author",
  });

  res.status(200).render("job", {
    title: job.name,
    job,
  });
});
