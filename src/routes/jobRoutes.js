const express = require("express");
const authController = require("../controllers/authController");
const jobController = require("../controllers/jobController");
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

router.use("/:jobId/reviews", reviewRouter);

router
  .route("/")
  .get(jobController.getAllJobs)
  .post(authController.protect, jobController.createJob);
router
  .route("/:id")
  .get(jobController.getJob)
  .patch(authController.protect, jobController.updateJob)
  .delete(authController.protect, jobController.deleteJob);

module.exports = router;
