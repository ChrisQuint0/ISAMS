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
  // Check if we're in development mode
  const isDevelopment =
    import.meta.env.DEV || window.location.hostname === "localhost";

  if (isDevelopment) {
    // Local development - use local backend servers
    return "http://localhost:3000";
  }

  // Production or desktop app - use current domain or Vercel
  // This works because Vercel handles /api routing automatically
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
