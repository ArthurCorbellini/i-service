const express = require("express");
const authController = require("../controllers/authController");
const jobController = require("../controllers/jobController");
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

router.use("/:jobId/reviews", reviewRouter);

router
  .route("/")
  .get(jobController.getAllJobs)
  .post(
    authController.protect,
    authController.restrictTo("user"),
    jobController.createJob
  );
router
  .route("/:id")
  .get(jobController.getJob)
  .patch(
    authController.protect,
    authController.restrictTo("user"),
    jobController.updateJob
  )
  .delete(
    authController.protect,
    authController.restrictTo("user"),
    jobController.deleteJob
  );

module.exports = router;
