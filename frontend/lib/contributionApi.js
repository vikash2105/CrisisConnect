const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

export async function getReportedIncidents() {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/contributions/reported`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error("Failed to fetch reported incidents")
  return response.json()
}

export async function getVolunteeredIncidents() {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/contributions/volunteered`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error("Failed to fetch volunteered incidents")
  return response.json()
}

export async function getContributionStats() {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/contributions/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error("Failed to fetch contribution stats")
  return response.json()
}

export async function volunteerForIncident(incidentId) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/volunteer`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to volunteer")
  }
  return response.json()
}

export async function unvolunteerFromIncident(incidentId) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/volunteer`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to unvolunteer")
  }
  return response.json()
}

export async function deleteIncident(incidentId) {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/contributions/incident/${incidentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to delete incident")
  }
  return response.json()
}
