const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'Fire',
      'Flood',
      'Power Outage',
      'Accident',
      'Medical Emergency',
      'Blood Donation',
      'Food & Water Aid',
      'Shelter Help',
      'Elderly Support',
      'Lost Pet',
      'Cleanup Drive',
      'Community Support',
      'Other'
    ]
  },
  description: { type: String, required: true },
  address: { type: String, required: true }, // Moved address to be a top-level field
  location: { // This field is now a pure GeoJSON object
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  // --- NEW FIELD ADDED HERE ---
  imageUrl: {
    type: String, // Stores the URL of the uploaded image
    required: false // Optional field
  },
  captureSource: {
    type: String,
    enum: ['camera', 'gallery', 'unknown'],
    default: 'unknown'
  },
  browserLocation: {
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date
  },
  imageExif: {
    timestamp: Date,
    gps: {
      latitude: Number,
      longitude: Number
    },
    make: String,
    model: String,
    software: String,
    hasExif: { type: Boolean, default: false }
  },
  imageTimestamp: Date,
  imageGPS: {
    latitude: Number,
    longitude: Number
  },
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 35
  },
  verificationStatus: {
    type: String,
    enum: ['verified', 'partially_verified', 'suspicious', 'outdated'],
    default: 'partially_verified'
  },
  verificationReasons: [{
    type: String
  }],
  activeUntil: {
    type: Date,
    required: false
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  verificationVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vote: {
      type: String,
      enum: ['confirmed', 'misleading', 'fake_outdated'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  communityConfidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  communityVerification: {
    confirmed: { type: Number, default: 0 },
    misleading: { type: Number, default: 0 },
    fakeOutdated: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  volunteers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

// The index now correctly points to the GeoJSON 'location' field
IncidentSchema.index({ location: '2dsphere' });
IncidentSchema.index({ activeUntil: 1, status: 1 });
IncidentSchema.index({ verificationStatus: 1, trustScore: -1 });

module.exports = mongoose.model('Incident', IncidentSchema);
