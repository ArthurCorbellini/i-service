const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

// "mergeParams" basicamente libera os parâmetros vindos de um outro router;
//  -> .../jobs/:jobId/reviews, vai cair no router "/";
const router = express.Router({ mergeParams: true });

// "protect" em todas as rotas depois deste middleware;
router.use(authController.protect);
router
  .route("/")
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo("user"),
    reviewController.setJobUserIds,
    reviewController.createReview
  );
router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = router;
