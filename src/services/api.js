import axios from "axios";

// Get environment variables, prioritizing runtime variables over build-time ones
const getRuntimeEnv = (key, defaultValue) => {
  // Check if we have runtime environment variables
  if (window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  // Fall back to build-time environment variables
  return process.env[key] || defaultValue;
};

// API configuration with more reliable defaults
const API_CONFIG = {
  personaEngine: getRuntimeEnv(
    "REACT_APP_PERSONA_ENGINE_URL",
    "http://localhost:5001" // Changed default to ladaptiveai-personaar-frontendocalhost instead of Docker service name
  ),
  dialogOrchestrator: getRuntimeEnv(
    "REACT_APP_DIALOG_ORCHESTRATOR_URL",
    "http://localhost:5002" // Changed default to localhost instead of Docker service name
  ),
};

// Only use Docker service names if specifically set through environment variables
if (!window.location.hostname.includes("localhost") && 
    !window.location.hostname.includes("127.0.0.1")) {
  // If not on localhost and no environment variables are set, we're probably in production
  if (!window.ENV?.REACT_APP_PERSONA_ENGINE_URL && 
      !process.env.REACT_APP_PERSONA_ENGINE_URL) {
    API_CONFIG.personaEngine = "http://persona-engine-service:5001";
  }
  if (!window.ENV?.REACT_APP_DIALOG_ORCHESTRATOR_URL && 
      !process.env.REACT_APP_DIALOG_ORCHESTRATOR_URL) {
    API_CONFIG.dialogOrchestrator = "http://dialog-orchestrator-service:5002";
  }
}

console.log("Using API endpoints:", API_CONFIG);

// Create axios instances for each service
const personaApi = axios.create({
  baseURL: API_CONFIG.personaEngine,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000, // Add timeout to avoid long waits for failed connections
});

const dialogApi = axios.create({
  baseURL: API_CONFIG.dialogOrchestrator,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000, // Add timeout to avoid long waits for failed connections
});

// Persona Engine API calls
export const getPersonaProfile = async (userId) => {
  try {
    const response = await personaApi.get(`/api/personas/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching persona profile:", error);
    throw error;
  }
};

export const updatePersonaTrait = async (userId, trait, value) => {
  try {
    const response = await personaApi.put(`/api/personas/${userId}`, {
      trait,
      value,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating persona trait:", error);
    throw error;
  }
};

// Dialog Orchestrator API calls
export const sendMessage = async (userId, userText) => {
  try {
    const response = await dialogApi.post(`/api/dialog/${userId}`, {
      user_text: userText,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending message to dialog orchestrator:", error);
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
      message: error.response.data.message || "An error occurred with the API",
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      status: 0,
      data: null,
      message:
        "No response received from server. Please check your connection.",
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      status: 0,
      data: null,
      message: error.message || "Unknown error occurred",
    };
  }
};
