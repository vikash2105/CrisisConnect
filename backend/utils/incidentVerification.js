const exifParser = require('exif-parser');

const DEFAULT_IMAGE_FRESHNESS_HOURS = Number(process.env.IMAGE_FRESHNESS_HOURS || 24);
const DEFAULT_GPS_MATCH_KM = Number(process.env.IMAGE_GPS_MATCH_KM || 2);

const CATEGORY_EXPIRY_HOURS = {
  Fire: 12,
  Flood: 48,
  Accident: 6,
  'Medical Emergency': 6,
  'Blood Donation': 24,
  'Power Outage': 24,
  'Food & Water Aid': 24,
  'Shelter Help': 48,
  'Elderly Support': 24,
  'Lost Pet': 72,
  'Cleanup Drive': 48,
  'Community Support': 48,
  Other: 24,
};

function parseJsonField(value, fallback = null) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function sanitizeString(value, maxLength = 120) {
  if (typeof value !== 'string') return undefined;
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength) || undefined;
}

function sanitizeLocation(value) {
  if (!value || typeof value !== 'object') return null;

  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);
  const accuracy = Number(value.accuracy);
  const timestamp = value.timestamp ? new Date(value.timestamp) : null;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy) ? Math.max(0, accuracy) : undefined,
    timestamp: timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp : new Date(),
  };
}

function extractExifFromBuffer(buffer) {
  if (!buffer) return { hasExif: false };

  try {
    const parsed = exifParser.create(buffer).parse();
    const tags = parsed.tags || {};
    const timestampSeconds = tags.DateTimeOriginal || tags.CreateDate || tags.ModifyDate;
    const timestamp = timestampSeconds ? new Date(timestampSeconds * 1000) : undefined;
    const hasGps = Number.isFinite(tags.GPSLatitude) && Number.isFinite(tags.GPSLongitude);

    return {
      timestamp: timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp : undefined,
      gps: hasGps
        ? {
            latitude: Number(tags.GPSLatitude),
            longitude: Number(tags.GPSLongitude),
          }
        : undefined,
      make: sanitizeString(tags.Make),
      model: sanitizeString(tags.Model),
      software: sanitizeString(tags.Software),
      hasExif: Object.keys(tags).length > 0,
    };
  } catch (error) {
    console.warn('[Verification] EXIF parse failed:', error.message);
    return { hasExif: false };
  }
}

function haversineKm(a, b) {
  if (!a || !b) return null;

  const lat1 = Number(a.latitude);
  const lon1 = Number(a.longitude);
  const lat2 = Number(b.latitude);
  const lon2 = Number(b.longitude);

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLon * sinLon;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getActiveUntil(category, now = new Date()) {
  const hours = CATEGORY_EXPIRY_HOURS[category] || 24;
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

function calculateCommunityStats(votes = []) {
  const totals = votes.reduce(
    (acc, vote) => {
      if (vote.vote === 'confirmed') acc.confirmed += 1;
      if (vote.vote === 'misleading') acc.misleading += 1;
      if (vote.vote === 'fake_outdated') acc.fakeOutdated += 1;
      acc.total += 1;
      return acc;
    },
    { confirmed: 0, misleading: 0, fakeOutdated: 0, total: 0 }
  );

  const confidence = totals.total > 0 ? Math.round((totals.confirmed / totals.total) * 100) : 0;

  return {
    communityVerification: totals,
    communityConfidence: confidence,
  };
}

function calculateTrustScore({
  captureSource = 'unknown',
  imageExif = {},
  incidentLocation,
  browserLocation,
  reportedByUser,
  now = new Date(),
}) {
  let score = 35;
  const reasons = [];
  const freshnessMs = DEFAULT_IMAGE_FRESHNESS_HOURS * 60 * 60 * 1000;

  if (captureSource === 'camera') {
    score += 30;
    reasons.push('Live camera capture reported');
  } else if (captureSource === 'gallery') {
    reasons.push('Existing photo uploaded');
  }

  if (!imageExif?.hasExif) {
    score -= 30;
    reasons.push('Image metadata missing');
  }

  if (imageExif?.timestamp) {
    const ageMs = now.getTime() - new Date(imageExif.timestamp).getTime();
    if (ageMs <= freshnessMs && ageMs >= -10 * 60 * 1000) {
      score += 20;
      reasons.push('Image timestamp is recent');
    } else {
      score -= 50;
      reasons.push('Image appears older than the freshness threshold');
    }
  } else {
    reasons.push('Image timestamp unavailable');
  }

  if (imageExif?.gps) {
    const imageDistance = haversineKm(imageExif.gps, incidentLocation);
    if (imageDistance !== null && imageDistance <= DEFAULT_GPS_MATCH_KM) {
      score += 25;
      reasons.push('Image GPS matches incident location');
    } else {
      score -= 40;
      reasons.push('Image GPS differs from incident location');
    }
  } else {
    score -= 10;
    reasons.push('Image GPS unavailable');
  }

  const browserDistance = haversineKm(browserLocation, incidentLocation);
  if (browserDistance !== null && browserDistance <= DEFAULT_GPS_MATCH_KM) {
    score += 15;
    reasons.push('Browser GPS is near selected incident location');
  } else {
    score -= 15;
    reasons.push('Browser GPS is not near selected incident location');
  }

  if (reportedByUser) {
    score += 10;
    reasons.push('Authenticated reporter');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let verificationStatus = 'partially_verified';
  if (reasons.some((reason) => reason.includes('older than'))) verificationStatus = 'outdated';
  else if (score >= 80) verificationStatus = 'verified';
  else if (score < 45) verificationStatus = 'suspicious';

  return { trustScore: score, verificationStatus, verificationReasons: reasons };
}

function getExpiryState(incident, now = new Date()) {
  const activeUntil = incident.activeUntil ? new Date(incident.activeUntil) : getActiveUntil(incident.category, new Date(incident.createdAt || now));
  const isExpired = activeUntil.getTime() <= now.getTime();
  return { activeUntil, isExpired };
}

module.exports = {
  DEFAULT_GPS_MATCH_KM,
  DEFAULT_IMAGE_FRESHNESS_HOURS,
  calculateCommunityStats,
  calculateTrustScore,
  extractExifFromBuffer,
  getActiveUntil,
  getExpiryState,
  haversineKm,
  parseJsonField,
  sanitizeLocation,
};
