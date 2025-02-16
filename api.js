// api.js

// Use an environment variable for the API base URL.
// During development, this should be something like "http://localhost:8000"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Retrieves the list of sounds from the FastAPI backend.
 */
export async function getSounds() {
  try {
    // Fetch from the backend using the base URL.
    const response = await fetch(`${API_BASE_URL}/sounds`);

    if (!response.ok) {
      throw new Error("Failed to fetch sounds");
    }
    const soundsData = await response.json();
    return soundsData;
  } catch (error) {
    console.error("Error in getSounds:", error);
    throw error;
  }
}

/**
 * Sends a PUT request to update a sound.
 * @param {Object} sound - The sound object to update.
 */
export async function updateSound(sound) {
  try {
    const response = await fetch(`${API_BASE_URL}/sounds/${sound.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sound)
    });
    if (!response.ok) {
      throw new Error("Failed to update sound");
    }
    const updatedSound = await response.json();
    return updatedSound;
  } catch (error) {
    console.error("Error in updateSound:", error);
    throw error;
  }
}
