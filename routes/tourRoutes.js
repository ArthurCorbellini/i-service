const express = require("express");
const controller = require("../controllers/tourController");

const router = express.Router();

// checa se o id passado por parâmetro na url existe (middleware);
// router.param("id", controller.checkId);

router
  .route("/top-5-cheap")
  .get(controller.aliasTopTours, controller.getAllTours);

router.route("/").get(controller.getAllTours).post(controller.createTour);
router
  .route("/:id")
  .get(controller.getTour)
  .patch(controller.updateTour)
  .delete(controller.deleteTour);

module.exports = router;
