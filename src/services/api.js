import axios from "axios";

/**
 * API Client Module
 * This module provides a centralized way to interact with backend services.
 * It handles configuration, error management, and organizes API endpoints by service.
 */

// Environment configuration utilities
// -----------------------------------------------------------------------------

/**
 * Gets environment variables, prioritizing runtime variables over build-time ones
 * @param {string} key - The environment variable key
 * @param {*} defaultValue - Default value if key is not found
 * @return {*} The environment variable value or default
 */
const getRuntimeEnv = (key, defaultValue) => {
  // Check if we have runtime environment variables
  if (window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  // Fall back to build-time environment variables
  return process.env[key] || defaultValue;
};

/**
 * Determines if we're running in development or production
 */
const isLocalDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';

// Global API configuration
// -----------------------------------------------------------------------------

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
  timeout: 5000, // 5 second timeout
};

// API Client Factory
// -----------------------------------------------------------------------------

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
  
  // Add response interceptor for global error handling
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

// Create service-specific API clients
const personaApi = createApiClient(API_ENDPOINTS.personaEngine);
const dialogApi = createApiClient(API_ENDPOINTS.dialogOrchestrator);

// Error Handler
// -----------------------------------------------------------------------------

/**
 * Standardizes API error responses across the application
 * @param {Error} error - The error thrown by axios
 * @return {Object} A standardized error object
 */
export const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    return {
      status: error.response.status,
      data: error.response.data,
      message: error.response.data?.message || "An error occurred with the API",
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      status: 0,
      data: null,
      message: "No response received from server. Please check your connection.",
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

// API Services
// -----------------------------------------------------------------------------

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
      // Error is already processed by the interceptor
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
      // Error is already processed by the interceptor
      throw error;
    }
  }
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
      // Error is already processed by the interceptor
      throw error;
    }
  }
};

// Legacy exports for backward compatibility
// These should be gradually replaced with the service-based approach
// -----------------------------------------------------------------------------
export const getPersonaProfile = personaService.getProfile;
export const updatePersonaTrait = personaService.updateTrait;
export const sendMessage = dialogService.sendMessage;
