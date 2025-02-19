// api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_OPENHOWL_API_URL;

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || response.statusText);
  }
  return response.json();
}

// Get the stored auth token
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// API Functions
export async function login(password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  const data = await handleResponse(response);
  localStorage.setItem('authToken', data.token);
  return data;
}

export async function getSounds() {
  const response = await fetch(`${API_BASE_URL}/sounds`);
  return handleResponse(response);
}

export async function updateSound(sound) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/sounds/${sound.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(sound),
  });
  return handleResponse(response);
}

export async function uploadSound(file, name) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', name);

  const response = await fetch(`${API_BASE_URL}/sounds/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  return handleResponse(response);
}

export async function uploadYouTubeSound(youtubeUrl, soundName) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/sounds/youtube`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      youtube_url: youtubeUrl,
      sound_name: soundName,
    }),
  });
  return handleResponse(response);
}

export async function deleteSound(soundId) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}/sounds/${soundId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}