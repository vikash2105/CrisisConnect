const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Add multiple locations to a user
router.post("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { locations } = req.body;

    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: "Locations must be a non-empty array" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.serviceLocations.push(...locations);
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all saved locations for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.serviceLocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a specific location
router.delete("/:userId/:locationId", async (req, res) => {
  try {
    const { userId, locationId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.serviceLocations = user.serviceLocations.filter(
      (loc) => loc._id.toString() !== locationId
    );
    await user.save();

    res.json(user.serviceLocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
