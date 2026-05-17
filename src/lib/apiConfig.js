/**
 * API Configuration
 * Dynamically determines the API base URL based on environment
 */

/**
 * Get the API base URL
 * - In development: Use localhost backend servers
 * - In production (Vercel): Use current domain's /api endpoints
 * - In desktop app: Use Vercel domain
 */
export function getApiBaseUrl() {
  // Check if we're running in Tauri desktop app
  const isTauri = window.__TAURI__ !== undefined;
  
  // Check if we're in development mode
  const isDevelopment =
    import.meta.env.DEV || 
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.protocol === "tauri:";

  if (isDevelopment || isTauri) {
    // Local development or desktop app - use local backend servers
    return "http://localhost:3000";
  }

  // Production on Vercel - use current domain's /api endpoints
  return window.location.origin;
}

/**
 * Get full API endpoint URL
 * @param {string} path - API path (e.g., '/api/users')
 * @returns {string} - Full API URL
 */
export function getApiUrl(path) {
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

export const API_BASE_URL = getApiBaseUrl();
