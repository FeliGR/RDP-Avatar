import axios from "axios";

const getRuntimeEnv = (key, defaultValue) => {
  if (window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }

  return process.env[key] || defaultValue;
};

const isLocalDevelopment =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

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

const DEFAULT_CONFIG = {
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
};

const createApiClient = (baseURL) => {
  const client = axios.create({
    ...DEFAULT_CONFIG,
    baseURL,
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const processedError = handleApiError(error);
      return Promise.reject(processedError);
    }
  );

  return client;
};

const personaApi = createApiClient(API_ENDPOINTS.personaEngine);
const dialogApi = createApiClient(API_ENDPOINTS.dialogOrchestrator);

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

export const personaService = {
  getProfile: async (userId) => {
    try {
      const response = await personaApi.get(`/api/personas/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
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

export const dialogService = {
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
