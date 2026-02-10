// ============================================
// API Configuration
// ============================================

/**
 * Backend API configuration
 *
 * This file centralizes all backend API URLs and settings.
 * Update BACKEND_URL to switch between development and production environments.
 */

// Production backend URL (Vercel deployment)
const PRODUCTION_URL = "https://rustyn-ai-one.vercel.app";

// Development backend URL (local server)
const DEVELOPMENT_URL = "http://localhost:3001";

// Automatically detect environment
// In Electron, process.env.NODE_ENV is set by the build process
const isDevelopment =
  process.env.NODE_ENV === "development" ||
  import.meta.env.DEV;

/**
 * Active backend URL
 * Defaults to production, switches to development in dev mode
 */
export const BACKEND_URL = isDevelopment ? DEVELOPMENT_URL : PRODUCTION_URL;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${BACKEND_URL}/api/auth/login`,
  LOGOUT: `${BACKEND_URL}/api/auth/logout`,
  VERIFY: `${BACKEND_URL}/api/auth/verify`,
  PROFILE: `${BACKEND_URL}/api/auth/profile`,
  HEALTH: `${BACKEND_URL}/api/auth/health`,

  // Root health check
  ROOT: `${BACKEND_URL}/`,
} as const;

/**
 * Local storage keys for authentication
 */
export const AUTH_STORAGE_KEYS = {
  TOKEN: "rustyn_ai_auth_token",
  USER: "rustyn_ai_auth_user",
  EXPIRY: "rustyn_ai_auth_expiry",
} as const;

/**
 * API request timeout (milliseconds)
 */
export const API_TIMEOUT = 30000; // 30 seconds

/**
 * API request headers
 */
export const API_HEADERS = {
  "Content-Type": "application/json",
} as const;

/**
 * Create authorization header with bearer token
 */
export function createAuthHeader(token: string): Record<string, string> {
  return {
    ...API_HEADERS,
    Authorization: `Bearer ${token}`,
  };
}

/**
 * API fetch wrapper with timeout and error handling
 */
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...API_HEADERS,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Parse response
    const data = await response.json();

    // Check for API-level errors
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("Request timeout - please check your internet connection");
    }

    throw error;
  }
}

/**
 * Log current API configuration (for debugging)
 */
export function logApiConfig(): void {
  console.log("========================================");
  console.log("  Rustyn AI - API Configuration");
  console.log("========================================");
  console.log(`  Environment : ${isDevelopment ? "Development" : "Production"}`);
  console.log(`  Backend URL : ${BACKEND_URL}`);
  console.log("========================================");
}
