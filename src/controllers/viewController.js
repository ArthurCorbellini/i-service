const msg = require("../../languages/pt-BR.json");
const catchAsync = require("../utils/catchAsync");
const Job = require("../models/jobModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");

exports.getOverview = catchAsync(async (req, res) => {
  res.status(200).render("overview", {
    title: msg["label.allJobs"],
    jobs: await Job.find(),
  });
});

exports.getJob = catchAsync(async (req, res, next) => {
  const job = await Job.findById(req.params.id).populate({
    path: "reviews",
    fields: "review rating author",
  });

  if (!job)
    return next(
      new AppError(
        msg["error.registerNotFoundWithId"].replace("{{id}}", req.params.id)
      )
    );

  res.status(200).render("job", {
    title: job.name,
    job,
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render("login", {
    title: msg["label.logIntoYourAccount"],
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: msg["label.yourAccount"],
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render("account", {
    title: msg["label.yourAccount"],
    user: updatedUser,
  });
});
