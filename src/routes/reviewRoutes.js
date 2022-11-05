const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

// "mergeParams" basicamente libera os parâmetros vindos de um outro router;
//  -> .../jobs/:jobId/reviews, vai cair no router "/";
const router = express.Router({ mergeParams: true });

router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo("user"),
    reviewController.createReview
  );
router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(authController.protect, reviewController.updateReview)
  .delete(authController.protect, reviewController.deleteReview);

module.exports = router;
