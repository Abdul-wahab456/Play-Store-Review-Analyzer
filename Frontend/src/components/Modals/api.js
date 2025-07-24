// config/api.js - Updated with better environment variable support

const config = {
  // Base URL for all API requests
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://15.207.249.221:8000",

  // Environment info
  environment: process.env.REACT_APP_ENVIRONMENT || "production",
  debugMode: process.env.REACT_APP_DEBUG_MODE === "true",
  isProduction: process.env.REACT_APP_ENVIRONMENT === "production",

  // App information
  appName: process.env.REACT_APP_APP_NAME || "Smart Upgrades",
  supportEmail: process.env.REACT_APP_SUPPORT_EMAIL || "support@example.com",

  // API Endpoints
  endpoints: {
    // Authentication endpoints
    CSRF: process.env.REACT_APP_API_CSRF_ENDPOINT || "/api/auth/csrf/",
    LOGIN: process.env.REACT_APP_API_LOGIN_ENDPOINT || "/api/auth/login/",
    SIGNUP: process.env.REACT_APP_API_SIGNUP_ENDPOINT || "/api/auth/signup/",
    PAYMENT_STATUS:
      process.env.REACT_APP_API_PAYMENT_STATUS_ENDPOINT ||
      "/api/auth/payment-status/",

    // App management endpoints
    PLAYSTORE_SEARCH:
      process.env.REACT_APP_API_PLAYSTORE_SEARCH_ENDPOINT ||
      "/api/playstore/search/",
    USER_APPS:
      process.env.REACT_APP_API_USER_APPS_ENDPOINT || "/api/user/apps/",

    // Payment endpoints
    VALIDATE_PAYMENT:
      process.env.REACT_APP_API_VALIDATE_PAYMENT_ENDPOINT ||
      "/api/validate-payment/",
    PROCESS_PAYMENT:
      process.env.REACT_APP_API_PROCESS_PAYMENT_ENDPOINT ||
      "/api/payments/process/",
    UPDATE_PAYMENT:
      process.env.REACT_APP_API_UPDATE_PAYMENT_ENDPOINT ||
      "/api/auth/update-payment/",
    MAIN_DASHBOARD: "/api/main/dashboard/",
    SENTIMENTAL_ANALYSIS: "api/sentiment-analysis/",
    FEATURE_ANALYSIS: "api/feature-analysis/",
  },

  // Third-party configurations
  googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || "",
  stripePublicKey: process.env.REACT_APP_STRIPE_PUBLIC_KEY || "",
  googleAnalyticsId: process.env.REACT_APP_GOOGLE_ANALYTICS_ID || "",

  // Request configuration
  defaultHeaders: {
    "Content-Type": "application/json",
  },

  // Timeout settings
  timeout: 30000, // 30 seconds
};

/**
 * Build a complete URL by combining base URL with endpoint
 * @param {string} endpoint - The API endpoint (from config.endpoints)
 * @returns {string} Complete URL
 */
export const buildURL = (endpoint) => {
  if (!endpoint) {
    throw new Error("Endpoint is required");
  }

  // Remove any leading slash from endpoint to avoid double slashes
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;

  // Ensure base URL doesn't end with slash
  const cleanBaseURL = config.baseURL.endsWith("/")
    ? config.baseURL.slice(0, -1)
    : config.baseURL;

  const fullURL = `${cleanBaseURL}/${cleanEndpoint}`;

  // Only log in development mode
  if (config.debugMode) {
    console.log(`🌐 Building URL: ${endpoint} -> ${fullURL}`);
  }

  return fullURL;
};

/**
 * Get default fetch options with authentication headers
 * @param {Object} options - Additional fetch options
 * @returns {Object} Fetch options object
 */
export const getDefaultFetchOptions = (options = {}) => {
  return {
    credentials: "include",
    headers: {
      ...config.defaultHeaders,
      ...options.headers,
    },
    timeout: config.timeout,
    ...options,
  };
};

/**
 * Helper function to make authenticated API requests with better error handling
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch promise
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = buildURL(endpoint);
  const fetchOptions = getDefaultFetchOptions(options);

  if (config.debugMode) {
    console.log(
      `📡 API Request: ${options.method || "GET"} ${url}`,
      options.body ? JSON.parse(options.body) : ""
    );
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (config.debugMode) {
      console.log(`📨 API Response: ${response.status} ${url}`);
    }

    return response;
  } catch (error) {
    console.error(`❌ API request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Helper function to handle API responses consistently
 * @param {Response} response - Fetch response object
 * @param {string} endpoint - The endpoint for logging
 * @returns {Promise} Parsed JSON response
 */
export const handleAPIResponse = async (response, endpoint = "") => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));

    if (config.debugMode) {
      console.error(
        `❌ API Error ${response.status} for ${endpoint}:`,
        errorData
      );
    }

    throw new Error(
      errorData.message || `Request failed with status ${response.status}`
    );
  }

  const data = await response.json();

  if (config.debugMode) {
    console.log(`✅ API Success for ${endpoint}:`, data);
  }

  return data;
};

/**
 * Environment validation - warns about missing required environment variables
 */
export const validateEnvironment = () => {
  const requiredVars = ["REACT_APP_API_BASE_URL"];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn("⚠️ Missing environment variables:", missingVars);
  }

  // Warn about placeholder values
  const placeholders = {
    REACT_APP_GOOGLE_CLIENT_ID: "your_google_client_id_here",
    REACT_APP_STRIPE_PUBLIC_KEY: "your_stripe_public_key_here",
  };

  Object.entries(placeholders).forEach(([key, placeholder]) => {
    if (process.env[key] === placeholder) {
      console.warn(`⚠️ ${key} is still using placeholder value`);
    }
  });
};

// Run environment validation in development
if (config.debugMode) {
  validateEnvironment();
}

// Export individual parts for easy access
export const env = {
  API_BASE_URL: config.baseURL,
  IS_PRODUCTION: config.isProduction,
  DEBUG_MODE: config.debugMode,
  APP_NAME: config.appName,
  SUPPORT_EMAIL: config.supportEmail,
  STRIPE_PUBLIC_KEY: config.stripePublicKey,
  GOOGLE_CLIENT_ID: config.googleClientId,
};

// Export config as default
export default config;
