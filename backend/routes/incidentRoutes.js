const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Incident = require('../models/Incident');
const authMiddleware = require('../middleware/authMiddleware');
const {
  calculateCommunityStats,
  calculateTrustScore,
  extractExifFromBuffer,
  getActiveUntil,
  getExpiryState,
  parseJsonField,
  sanitizeLocation
} = require('../utils/incidentVerification');

// --- CLOUDINARY CONFIGURATION ---
// This automatically uses the keys from your .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- MULTER CONFIGURATION ---
// We use memoryStorage to temporarily hold the file as a buffer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  }
});

// --- CLOUDINARY UPLOAD HELPER FUNCTION ---
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    // Create an upload stream to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "crisisconnect_incidents" }, // Optional: This will organize uploads in a specific folder
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    // Pipe the file buffer into the upload stream
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// --- ROUTES ---

// POST /api/incidents - Report a new incident
// We add the 'upload.single('media')' middleware to handle the file
router.post('/', authMiddleware, upload.single('media'), async (req, res) => {
  try {
    const { category, description, address, coordinates } = req.body;
    let imageUrl = null;
    const parsedCoordinates = JSON.parse(coordinates);
    const incidentLocation = {
      longitude: Number(parsedCoordinates[0]),
      latitude: Number(parsedCoordinates[1])
    };
    const browserLocation = sanitizeLocation(parseJsonField(req.body.browserLocation));
    const captureSource = ['camera', 'gallery'].includes(req.body.captureSource) ? req.body.captureSource : 'unknown';

    if (!browserLocation) {
      return res.status(400).json({ message: 'Browser geolocation is required to submit an emergency report.' });
    }

    if (!Number.isFinite(incidentLocation.longitude) || !Number.isFinite(incidentLocation.latitude)) {
      return res.status(400).json({ message: 'Valid incident coordinates are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'A photo is required for trust verification.' });
    }

    const recentDuplicate = await Incident.findOne({
      reportedBy: req.user.id,
      category,
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) },
      status: { $ne: 'Resolved' },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: parsedCoordinates },
          $maxDistance: 100
        }
      }
    });

    if (recentDuplicate) {
      return res.status(429).json({ message: 'A similar report was submitted recently from this location.' });
    }

    const imageExif = extractExifFromBuffer(req.file.buffer);
    const trust = calculateTrustScore({
      captureSource,
      imageExif,
      incidentLocation,
      browserLocation,
      reportedByUser: req.user.id
    });

    // 1. Check if a file was uploaded
    if (req.file) {
      // 2. If yes, upload it to Cloudinary (only if credentials are configured)
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        try {
          const uploadResult = await uploadToCloudinary(req.file.buffer);
          // 3. Get the secure URL of the uploaded image
          imageUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.warn('Cloudinary upload failed:', uploadError.message);
          console.warn('Incident will be created without image');
          // Continue without image if upload fails
        }
      } else {
        console.warn('Cloudinary credentials not configured. Incident will be created without image.');
      }
    }

    // 4. Create a new incident with all the data
    const incident = new Incident({
      category: String(category || '').trim(),
      description: String(description || '').trim(),
      address: String(address || '').trim(),
      location: {
        type: 'Point',
        coordinates: parsedCoordinates
      },
      imageUrl: imageUrl, // Add the image URL here (will be null if no file was uploaded)
      captureSource,
      browserLocation,
      imageExif,
      imageTimestamp: imageExif.timestamp,
      imageGPS: imageExif.gps,
      activeUntil: getActiveUntil(category),
      trustScore: trust.trustScore,
      verificationStatus: trust.verificationStatus,
      verificationReasons: trust.verificationReasons,
      reportedBy: req.user.id
    });

    await incident.save();
    
    // Emit WebSocket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Populate the reportedBy field before emitting
      const populatedIncident = await Incident.findById(incident._id).populate('reportedBy', 'fullname email');
      io.emit('new-incident', populatedIncident);
      console.log('New incident emitted via WebSocket:', populatedIncident._id);
    }
    
    res.status(201).json(incident);
  } catch (error) {
    console.error("Error reporting incident:", error);
    if (error instanceof SyntaxError) {
      return res.status(400).json({ message: 'Invalid report location payload.' });
    }
    if (error.message === 'Only image uploads are allowed') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/incidents/nearby?lat=...&lng=... - Get nearby incidents
router.get('/nearby', authMiddleware, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and Longitude are required.' });
        }

        const maxDistance = 10000; // 10 kilometers

        const incidents = await Incident.find({
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: maxDistance
                }
            },
            status: { $ne: 'Resolved' },
            $or: [
                { activeUntil: { $exists: false } },
                { activeUntil: { $gt: new Date() } }
            ],
            isExpired: { $ne: true }
        }).populate('reportedBy', 'fullname').sort({ createdAt: -1 });

        res.json(incidents);
    } catch (error) { // --- THIS IS THE CORRECTED BLOCK ---
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/incidents/:id/verify - Community verification vote
router.post('/:id/verify', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { vote } = req.body;
        const allowedVotes = ['confirmed', 'misleading', 'fake_outdated'];

        if (!allowedVotes.includes(vote)) {
            return res.status(400).json({ message: 'Invalid verification vote.' });
        }

        const incident = await Incident.findById(req.params.id);
        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        if (incident.reportedBy && incident.reportedBy.toString() === userId.toString()) {
            return res.status(400).json({ message: 'You cannot verify your own report.' });
        }

        const existingVote = incident.verificationVotes.find((entry) => entry.user.toString() === userId.toString());
        if (existingVote) {
            existingVote.vote = vote;
            existingVote.createdAt = new Date();
        } else {
            incident.verificationVotes.push({ user: userId, vote });
        }

        const community = calculateCommunityStats(incident.verificationVotes);
        incident.communityVerification = community.communityVerification;
        incident.communityConfidence = community.communityConfidence;

        const expiry = getExpiryState(incident);
        incident.activeUntil = expiry.activeUntil;
        incident.isExpired = expiry.isExpired;

        await incident.save();

        const populated = await Incident.findById(incident._id)
          .populate('reportedBy', 'fullname email')
          .populate('volunteers', 'fullname email');

        try {
            const io = req.app.get('io');
            if (io) io.emit('incident-updated', populated);
        } catch (e) {
            console.warn('WS emit failed (verification vote):', e?.message);
        }

        res.json({
            message: 'Verification vote recorded',
            incident: populated
        });
    } catch (error) {
        console.error('Error recording verification vote:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/incidents/:id/volunteer - Volunteer for an incident
router.post('/:id/volunteer', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const incidentId = req.params.id;

        // Find the incident
        const incident = await Incident.findById(incidentId);

        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        // Check if user already volunteered (compare ObjectId to string safely)
        const alreadyVolunteer = incident.volunteers.some(v => v.toString() === userId.toString());
        if (alreadyVolunteer) {
            return res.status(400).json({ message: 'You have already volunteered for this incident' });
        }

        // Check if user is the reporter (guard legacy docs that may miss reportedBy)
        if (incident.reportedBy && incident.reportedBy.toString() === userId.toString()) {
            return res.status(400).json({ message: 'You cannot volunteer for your own reported incident' });
        }

        // Add user to volunteers
        incident.volunteers.push(userId);

        // Update status to "In Progress" if it was "Pending"
        if (incident.status === 'Pending') {
            incident.status = 'In Progress';
        }

        await incident.save();

        // Emit WebSocket event for real-time updates
        try {
            const io = req.app.get('io');
            if (io) {
                const populated = await Incident.findById(incident._id)
                  .populate('reportedBy', 'fullname email')
                  .populate('volunteers', 'fullname email');
                io.emit('incident-updated', populated);
            }
        } catch (e) {
            console.warn('WS emit failed (volunteer add):', e?.message);
        }

        res.json({
            message: 'Successfully volunteered for incident',
            incident: await incident.populate('reportedBy volunteers', 'fullname email')
        });
    } catch (error) {
        console.error('Error volunteering for incident:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE /api/incidents/:id/volunteer - Remove volunteer status
router.delete('/:id/volunteer', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const incidentId = req.params.id;

        // Find the incident
        const incident = await Incident.findById(incidentId);

        if (!incident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        // Check if user is in volunteers (compare ObjectId to string safely)
        const isVolunteer = incident.volunteers.some(v => v.toString() === userId.toString());
        if (!isVolunteer) {
            return res.status(400).json({ message: 'You are not volunteering for this incident' });
        }

        // Remove user from volunteers
        incident.volunteers = incident.volunteers.filter(id => id.toString() !== userId.toString());

        // Update status back to "Pending" if no volunteers left and status is "In Progress"
        if (incident.volunteers.length === 0 && incident.status === 'In Progress') {
            incident.status = 'Pending';
        }

        await incident.save();

        // Emit WebSocket event for real-time updates on removal
        try {
            const io = req.app.get('io');
            if (io) {
                const populated = await Incident.findById(incident._id)
                  .populate('reportedBy', 'fullname email')
                  .populate('volunteers', 'fullname email');
                io.emit('incident-updated', populated);
            }
        } catch (e) {
            console.warn('WS emit failed (volunteer remove):', e?.message);
        }

        res.json({
            message: 'Successfully removed from incident volunteers',
            incident: await incident.populate('reportedBy volunteers', 'fullname email')
        });
    } catch (error) {
        console.error('Error unvolunteering from incident:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
