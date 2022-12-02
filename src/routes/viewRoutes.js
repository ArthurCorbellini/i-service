const express = require("express");
const viewController = require("../controllers/viewController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/", authController.isLoggedIn, viewController.getOverview);
router.get("/job/:id", authController.isLoggedIn, viewController.getJob);
router.get("/login", authController.isLoggedIn, viewController.getLoginForm);
router.get("/me", authController.protect, viewController.getAccount);
router.post(
  "/submit-user-data",
  authController.protect,
  viewController.updateUserData
);

module.exports = router;
