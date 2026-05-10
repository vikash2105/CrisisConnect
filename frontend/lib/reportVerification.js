import imageCompression from "browser-image-compression"
import exifr from "exifr"

export const GPS_MATCH_THRESHOLD_KM = 2
export const IMAGE_FRESHNESS_HOURS = 24

export async function compressReportImage(file) {
  if (!file) return null

  return imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1800,
    useWebWorker: true,
    preserveExif: true,
  })
}

export async function extractImageMetadata(file) {
  if (!file) return { hasExif: false }

  try {
    const metadata = await exifr.parse(file, {
      tiff: true,
      ifd0: true,
      exif: true,
      gps: true,
      pick: ["DateTimeOriginal", "CreateDate", "ModifyDate", "latitude", "longitude", "Make", "Model", "Software"],
    })

    if (!metadata) return { hasExif: false }

    const timestamp = metadata.DateTimeOriginal || metadata.CreateDate || metadata.ModifyDate || null

    return {
      hasExif: true,
      timestamp: timestamp ? new Date(timestamp).toISOString() : null,
      gps:
        Number.isFinite(metadata.latitude) && Number.isFinite(metadata.longitude)
          ? { latitude: metadata.latitude, longitude: metadata.longitude }
          : null,
      make: metadata.Make || null,
      model: metadata.Model || null,
      software: metadata.Software || null,
    }
  } catch (error) {
    console.warn("EXIF extraction failed:", error)
    return { hasExif: false }
  }
}

export function getCurrentBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser does not support location services."))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp).toISOString(),
        })
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("Location permission is required to submit an emergency report."))
          return
        }
        reject(new Error("Could not determine your current location. Please try again."))
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    )
  })
}

export function getImageWarnings(metadata) {
  const warnings = []
  if (!metadata?.hasExif) warnings.push("Image metadata is missing, so this report may receive a lower trust score.")
  if (metadata?.hasExif && !metadata?.gps) warnings.push("Image GPS metadata is missing.")

  if (metadata?.timestamp) {
    const ageHours = (Date.now() - new Date(metadata.timestamp).getTime()) / (1000 * 60 * 60)
    if (ageHours > IMAGE_FRESHNESS_HOURS) warnings.push("This image appears to be old.")
  }

  return warnings
}

export function haversineKm(a, b) {
  if (!a || !b) return null
  const toRad = (degrees) => (degrees * Math.PI) / 180
  const lat1 = Number(a.latitude)
  const lon1 = Number(a.longitude)
  const lat2 = Number(b.latitude)
  const lon2 = Number(b.longitude)

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2

  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
