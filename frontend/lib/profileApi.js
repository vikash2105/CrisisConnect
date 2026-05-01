const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

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

  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    let message = "Failed to fetch profile"

    try {
      const errorBody = await response.json()
      if (errorBody && errorBody.message) message = errorBody.message
    } catch (_) {
      // ignore parse errors
    }

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
  }

  return response.json()
}
