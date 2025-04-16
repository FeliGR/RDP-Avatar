import axios from 'axios';

// Get environment variables, prioritizing runtime variables over build-time ones
const getRuntimeEnv = (key, defaultValue) => {
  // Check if we have runtime environment variables
  if (window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  // Fall back to build-time environment variables
  return process.env[key] || defaultValue;
};

// API configuration
const API_CONFIG = {
  personaEngine: getRuntimeEnv(
    'REACT_APP_PERSONA_ENGINE_URL',
    'http://persona-engine-service:5001'
  ),
  dialogOrchestrator: getRuntimeEnv(
    'REACT_APP_DIALOG_ORCHESTRATOR_URL',
    'http://adaptiveai-personaar-dialogorch:5002'
  )
};

// For local development fallback (when not running in Docker)
if (window.location.hostname === 'localhost' && 
    !getRuntimeEnv('REACT_APP_PERSONA_ENGINE_URL')) {
  API_CONFIG.personaEngine = 'http://localhost:5001';
  API_CONFIG.dialogOrchestrator = 'http://localhost:5002';
}

console.log('Using API endpoints:', API_CONFIG);

// Create axios instances for each service
const personaApi = axios.create({
  baseURL: API_CONFIG.personaEngine,
  headers: {
    'Content-Type': 'application/json'
  }
});

const dialogApi = axios.create({
  baseURL: API_CONFIG.dialogOrchestrator,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Persona Engine API calls
export const getPersonaProfile = async (userId) => {
  try {
    const response = await personaApi.get(`/api/personas/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching persona profile:', error);
    throw error;
  }
};

export const updatePersonaTrait = async (userId, trait, value) => {
  try {
    const response = await personaApi.put(`/api/personas/${userId}`, {
      trait,
      value
    });
    return response.data;
  } catch (error) {
    console.error('Error updating persona trait:', error);
    throw error;
  }
};

// Dialog Orchestrator API calls
export const sendMessage = async (userId, userText) => {
  try {
    const response = await dialogApi.post(`/api/dialog/${userId}`, {
      user_text: userText
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message to dialog orchestrator:', error);
    throw error;
  }
};

// Utility function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return {
      status: error.response.status,
      data: error.response.data,
      message: error.response.data.message || 'An error occurred with the API'
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      status: 0,
      data: null,
      message: 'No response received from server. Please check your connection.'
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      status: 0,
      data: null,
      message: error.message || 'Unknown error occurred'
    };
  }
};