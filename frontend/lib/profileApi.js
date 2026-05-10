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

export async function getProfile() {
  const token = getAuthToken()
  if (!token) {
    throw new Error("Authentication required. Please sign in again.")
  }

<<<<<<< HEAD
  let response
  try {
    response = await fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    console.error("Failed to fetch profile:", error)
    throw new Error(BACKEND_UNAVAILABLE_MESSAGE)
  }
=======
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })
>>>>>>> 094577356ad464c43002570066975adc57e46fb2

  if (!response.ok) {
    let message = "Failed to fetch profile"

<<<<<<< HEAD
    message = await getApiErrorMessage(response, message)
=======
    try {
      const errorBody = await response.json()
      if (errorBody && errorBody.message) message = errorBody.message
    } catch (_) {
      // ignore parse errors
    }
>>>>>>> 094577356ad464c43002570066975adc57e46fb2

    if (response.status === 401 || response.status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token")
        localStorage.removeItem("isAuthenticated")
      }
      message = "Your session has expired. Please sign in again."
    }

    throw new Error(message)
  }

  return response.json()
}

export async function updateProfile(profileData) {
  const token = getAuthToken()
<<<<<<< HEAD
  let response
  try {
    response = await fetch(`${API_URL}/api/profile`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    })
  } catch (error) {
    console.error("Failed to update profile:", error)
    throw new Error(BACKEND_UNAVAILABLE_MESSAGE)
  }

  if (!response.ok) {
    const message = await getApiErrorMessage(response, "Failed to update profile")
    throw new Error(message)
=======
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to update profile")
>>>>>>> 094577356ad464c43002570066975adc57e46fb2
  }

  return response.json()
}
