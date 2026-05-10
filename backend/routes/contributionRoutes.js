const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getReportedIncidents,
  getVolunteeredIncidents,
  getContributionStats,
  volunteerForIncident,
  unvolunteerFromIncident,
  deleteIncident
} = require('../controllers/contributionController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/contributions/reported - Get incidents reported by the user
router.get('/reported', getReportedIncidents);

// GET /api/contributions/volunteered - Get incidents where the user volunteered
router.get('/volunteered', getVolunteeredIncidents);

// GET /api/contributions/stats - Get contribution statistics for the user
router.get('/stats', getContributionStats);

// POST /api/contributions/volunteer/:incidentId - Volunteer for an incident
router.post('/volunteer/:incidentId', volunteerForIncident);

// DELETE /api/contributions/volunteer/:incidentId - Remove volunteer status from an incident
router.delete('/volunteer/:incidentId', unvolunteerFromIncident);

// DELETE /api/contributions/incident/:incidentId - Delete an incident reported by the user
router.delete('/incident/:incidentId', deleteIncident);

module.exports = router;

