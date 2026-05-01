const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Incident = require('../models/Incident');
const authMiddleware = require('../middleware/authMiddleware');

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
const upload = multer({ storage: storage });

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

    // When using FormData, numbers and objects are sent as strings. We need to parse them.
    const parsedCoordinates = JSON.parse(coordinates);

    // 4. Create a new incident with all the data
    const incident = new Incident({
      category,
      description,
      address,
      location: {
        type: 'Point',
        coordinates: parsedCoordinates
      },
      imageUrl: imageUrl, // Add the image URL here (will be null if no file was uploaded)
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
            status: { $ne: 'Resolved' }
        }).populate('reportedBy', 'fullname').sort({ createdAt: -1 });

        res.json(incidents);
    } catch (error) { // --- THIS IS THE CORRECTED BLOCK ---
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