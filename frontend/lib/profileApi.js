import { API_URL } from "@/lib/config"
import { BACKEND_UNAVAILABLE_MESSAGE, getApiErrorMessage } from "@/lib/apiError"

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

  let response
  try {
    response = await fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (error) {
    console.error("Failed to fetch profile:", error)
    throw new Error(BACKEND_UNAVAILABLE_MESSAGE)
  }

  if (!response.ok) {
    let message = "Failed to fetch profile"

    message = await getApiErrorMessage(response, message)

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
  }

  return response.json()
}
