import axios from "axios";

/**
 * API Client Module
 * This module provides a centralized way to interact with backend services.
 * It handles configuration, error management, and organizes API endpoints by service.
 */

/**
 * Gets environment variables, prioritizing runtime variables over build-time ones
 * @param {string} key - The environment variable key
 * @param {*} defaultValue - Default value if key is not found
 * @return {*} The environment variable value or default
 */
const getRuntimeEnv = (key, defaultValue) => {
  if (window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }

  return process.env[key] || defaultValue;
};

/**
 * Determines if we're running in development or production
 */
const isLocalDevelopment =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

/**
 * API endpoints configuration with environment-aware defaults
 */
const API_ENDPOINTS = {
  personaEngine: getRuntimeEnv(
    "REACT_APP_PERSONA_ENGINE_URL",
    isLocalDevelopment ? "http://localhost:5001" : "http://persona-engine-service:5001"
  ),
  dialogOrchestrator: getRuntimeEnv(
    "REACT_APP_DIALOG_ORCHESTRATOR_URL",
    isLocalDevelopment ? "http://localhost:5002" : "http://dialog-orchestrator-service:5002"
  ),
};

console.log("Using API endpoints:", API_ENDPOINTS);

/**
 * Default axios client configuration
 */
const DEFAULT_CONFIG = {
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
};

/**
 * Creates a configured axios instance with error handling interceptors
 * @param {string} baseURL - The base URL for this API client
 * @return {AxiosInstance} Configured axios instance
 */
const createApiClient = (baseURL) => {
  const client = axios.create({
    ...DEFAULT_CONFIG,
    baseURL,
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const processedError = handleApiError(error);
      console.error(`API Error: ${processedError.message}`, processedError);
      return Promise.reject(processedError);
    }
  );

  return client;
};

const personaApi = createApiClient(API_ENDPOINTS.personaEngine);
const dialogApi = createApiClient(API_ENDPOINTS.dialogOrchestrator);

/**
 * Standardizes API error responses across the application
 * @param {Error} error - The error thrown by axios
 * @return {Object} A standardized error object
 */
export const handleApiError = (error) => {
  if (error.response) {
    return {
      status: error.response.status,
      data: error.response.data,
      message: error.response.data?.message || "An error occurred with the API",
    };
  } else if (error.request) {
    return {
      status: 0,
      data: null,
      message: "No response received from server. Please check your connection.",
    };
  } else {
    return {
      status: 0,
      data: null,
      message: error.message || "Unknown error occurred",
    };
  }
};

/**
 * Persona Engine API Service
 * Handles interactions with the persona engine microservice
 */
export const personaService = {
  /**
   * Fetches a persona profile by user ID
   * @param {string} userId - The user identifier
   * @return {Promise<Object>} The persona data
   */
  getProfile: async (userId) => {
    try {
      const response = await personaApi.get(`/api/personas/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Updates a specific trait for a persona
   * @param {string} userId - The user identifier
   * @param {string} trait - The trait to update
   * @param {*} value - The new value for the trait
   * @return {Promise<Object>} Updated persona data
   */
  updateTrait: async (userId, trait, value) => {
    try {
      const response = await personaApi.put(`/api/personas/${userId}`, {
        trait,
        value,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

/**
 * Dialog Orchestrator API Service
 * Handles interactions with the dialog orchestration microservice
 */
export const dialogService = {
  /**
   * Sends a user message to the dialog service
   * @param {string} userId - The user identifier
   * @param {string} userText - The message text from the user
   * @return {Promise<Object>} The response data containing dialog information
   */
  sendMessage: async (userId, userText) => {
    try {
      const response = await dialogApi.post(`/api/dialog/${userId}`, {
        text: userText,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const getPersonaProfile = personaService.getProfile;
export const updatePersonaTrait = personaService.updateTrait;
export const sendMessage = dialogService.sendMessage;
