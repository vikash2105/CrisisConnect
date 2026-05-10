import { API_URL } from "@/lib/config"
import { BACKEND_UNAVAILABLE_MESSAGE, getApiErrorMessage } from "@/lib/apiError"

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

export async function getReportedIncidents() {
  const token = getAuthToken()
  const response = await safeFetch(`${API_URL}/api/contributions/reported`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(await getApiErrorMessage(response, "Failed to fetch reported incidents"))
  return response.json()
}

export async function getVolunteeredIncidents() {
  const token = getAuthToken()
  const response = await safeFetch(`${API_URL}/api/contributions/volunteered`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(await getApiErrorMessage(response, "Failed to fetch volunteered incidents"))
  return response.json()
}

export async function getContributionStats() {
  const token = getAuthToken()
  const response = await safeFetch(`${API_URL}/api/contributions/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(await getApiErrorMessage(response, "Failed to fetch contribution stats"))
  return response.json()
}

export async function volunteerForIncident(incidentId) {
  const token = getAuthToken()
  const response = await safeFetch(`${API_URL}/api/incidents/${incidentId}/volunteer`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to volunteer"))
  }
  return response.json()
}

export async function unvolunteerFromIncident(incidentId) {
  const token = getAuthToken()
  const response = await safeFetch(`${API_URL}/api/incidents/${incidentId}/volunteer`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to unvolunteer"))
  }
  return response.json()
}

export async function deleteIncident(incidentId) {
  const token = getAuthToken()
  const response = await safeFetch(`${API_URL}/api/contributions/incident/${incidentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "Failed to delete incident"))
  }
  return response.json()
}

async function safeFetch(url, options) {
  try {
    return await fetch(url, options)
  } catch (error) {
    console.error("Contribution API request failed:", error)
    throw new Error(BACKEND_UNAVAILABLE_MESSAGE)
  }
}
