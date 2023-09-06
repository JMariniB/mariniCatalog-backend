const express = require("express");
const router = express.Router();
const protect = require("../middleWare/authMiddleware");
const {
  createLocation,
  getLocations,
  deleteLocation,
  createMultipleLocations,
} = require("../controllers/locationController");

router.post("/", protect, createLocation);
router.post("/bulk", protect, createMultipleLocations);
router.get("/", protect, getLocations);
router.delete("/:id", protect, deleteLocation);

module.exports = router;