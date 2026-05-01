export async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
  const res = await fetch(url, { headers: { "User-Agent": "CrisisConnect App" } })

  if (!res.ok) return null

  const data = await res.json()

  if (Array.isArray(data) && data.length > 0) {
    return data[0] // Contains lat, lon, display_name, etc.
  }

  return null
}
