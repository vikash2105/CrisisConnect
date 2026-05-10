const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  state: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true }
});

const UserSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  skills: { type: String, default: '' },
  serviceLocations: { type: [locationSchema], default: [] },
  notifications: {
    emergencyAlerts: { type: Boolean, default: true },
    volunteerRequests: { type: Boolean, default: true },
    statusUpdates: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);