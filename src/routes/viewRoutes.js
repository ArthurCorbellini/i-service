const express = require("express");
const viewController = require("../controllers/viewController");

const router = express.Router();

router.get("/", viewController.getOverview);
router.get("/job/:id", viewController.getJob);

module.exports = router;
