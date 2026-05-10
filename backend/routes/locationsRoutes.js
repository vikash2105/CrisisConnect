const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

try {
    // Load offline dataset
    const indiaDataPath = path.join(__dirname, "../data/india_locations.json");
    const indiaData = JSON.parse(fs.readFileSync(indiaDataPath, "utf-8"));

    // Get all states
    router.get("/states", (req, res) => {
      res.json(Object.keys(indiaData));
    });

    // Get districts for a state
    router.get("/districts/:state", (req, res) => {
      const { state } = req.params;
      if (indiaData[state]) {
        res.json(Object.keys(indiaData[state].districts));
      } else {
        res.status(404).json({ error: "State not found" });
      }
    });

    // Get cities for a district
    router.get("/cities/:state/:district", (req, res) => {
      const { state, district } = req.params;
      if (indiaData[state] && indiaData[state].districts[district]) {
        res.json(indiaData[state].districts[district]);
      } else {
        res.status(404).json({ error: "District not found" });
      }
    });

} catch (error) {
    console.error("FATAL: Could not read the local india_locations.json file.", error);
    // If the file can't be read, send an error for all routes in this file.
    router.use((req, res, next) => {
        res.status(500).json({ error: "Could not load critical location data." });
    });
}

module.exports = router;