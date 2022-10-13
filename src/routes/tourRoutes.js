const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");

const router = express.Router();

// checa se o id passado por parâmetro na url existe (middleware);
// router.param("id", controller.checkId);

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);
router.route("/tour-stats").get(tourController.getToursStats);
router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);
router
  .route("/")
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
