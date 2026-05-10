export const BACKEND_UNAVAILABLE_MESSAGE = "Backend server is unavailable"

export async function getApiErrorMessage(response, fallback = "Request failed") {
  try {
    const data = await response.json()
    return data?.message || fallback
  } catch {
    return fallback
  }
}

export function getNetworkErrorMessage(error, fallback = "Request failed") {
  if (error instanceof TypeError) return BACKEND_UNAVAILABLE_MESSAGE
  return error?.message || fallback
}
