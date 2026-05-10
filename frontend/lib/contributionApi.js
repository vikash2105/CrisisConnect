<<<<<<< HEAD
import { API_URL } from "@/lib/config"
import { BACKEND_UNAVAILABLE_MESSAGE, getApiErrorMessage } from "@/lib/apiError"
=======
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
>>>>>>> 094577356ad464c43002570066975adc57e46fb2

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

export async function getReportedIncidents() {
  const token = getAuthToken()
<<<<<<< HEAD
  const response = await safeFetch(`${API_URL}/api/contributions/reported`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(await getApiErrorMessage(response, "Failed to fetch reported incidents"))
=======
  const response = await fetch(`${API_BASE_URL}/api/contributions/reported`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error("Failed to fetch reported incidents")
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
  return response.json()
}

export async function getVolunteeredIncidents() {
  const token = getAuthToken()
<<<<<<< HEAD
  const response = await safeFetch(`${API_URL}/api/contributions/volunteered`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(await getApiErrorMessage(response, "Failed to fetch volunteered incidents"))
=======
  const response = await fetch(`${API_BASE_URL}/api/contributions/volunteered`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error("Failed to fetch volunteered incidents")
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
  return response.json()
}

export async function getContributionStats() {
  const token = getAuthToken()
<<<<<<< HEAD
  const response = await safeFetch(`${API_URL}/api/contributions/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(await getApiErrorMessage(response, "Failed to fetch contribution stats"))
=======
  const response = await fetch(`${API_BASE_URL}/api/contributions/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error("Failed to fetch contribution stats")
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
  return response.json()
}

export async function volunteerForIncident(incidentId) {
  const token = getAuthToken()
<<<<<<< HEAD
  const response = await safeFetch(`${API_URL}/api/incidents/${incidentId}/volunteer`, {
=======
  const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/volunteer`, {
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
<<<<<<< HEAD
    throw new Error(await getApiErrorMessage(response, "Failed to volunteer"))
=======
    const error = await response.json()
    throw new Error(error.message || "Failed to volunteer")
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
  }
  return response.json()
}

export async function unvolunteerFromIncident(incidentId) {
  const token = getAuthToken()
<<<<<<< HEAD
  const response = await safeFetch(`${API_URL}/api/incidents/${incidentId}/volunteer`, {
=======
  const response = await fetch(`${API_BASE_URL}/api/incidents/${incidentId}/volunteer`, {
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
<<<<<<< HEAD
    throw new Error(await getApiErrorMessage(response, "Failed to unvolunteer"))
=======
    const error = await response.json()
    throw new Error(error.message || "Failed to unvolunteer")
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
  }
  return response.json()
}

export async function deleteIncident(incidentId) {
  const token = getAuthToken()
<<<<<<< HEAD
  const response = await safeFetch(`${API_URL}/api/contributions/incident/${incidentId}`, {
=======
  const response = await fetch(`${API_BASE_URL}/api/contributions/incident/${incidentId}`, {
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
<<<<<<< HEAD
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
=======
    const error = await response.json()
    throw new Error(error.message || "Failed to delete incident")
  }
  return response.json()
}
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
