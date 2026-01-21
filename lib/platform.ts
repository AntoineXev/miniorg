/**
 * Platform detection utilities for Tauri vs Web environments
 */

declare global {
  interface Window {
    __TAURI__?: any;
  }
}

/**
 * Check if the app is running in Tauri (desktop app)
 */
export const isTauri = (): boolean => {
  if (typeof window === 'undefined') return false;
  return '__TAURI__' in window;
};

/**
 * Check if the app is running in a web browser
 */
export const isWeb = (): boolean => {
  return !isTauri();
};

/**
 * Get the base URL for API calls
 * In Tauri: Use the Cloudflare API endpoint
 * In Web: Use relative URLs (same origin)
 */
export const getApiBaseUrl = (): string => {
  if (isTauri()) {
    // In production, this should point to your deployed Cloudflare Workers
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8788';
  }
  return ''; // Relative URLs for web (same origin)
};

/**
 * Get the full API URL for a given path
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Platform-specific configuration
 */
export const platformConfig = {
  /**
   * Whether to use native notifications (Tauri) or browser notifications (Web)
   */
  useNativeNotifications: isTauri(),
  
  /**
   * Whether to enable offline mode (future feature)
   */
  supportsOffline: false,
  
  /**
   * Whether to use system tray
   */
  hasSystemTray: isTauri(),
  
  /**
   * Whether global shortcuts are available
   */
  hasGlobalShortcuts: isTauri(),
};

/**
 * Environment info for debugging
 */
export const getEnvironmentInfo = () => {
  return {
    platform: isTauri() ? 'tauri' : 'web',
    apiBaseUrl: getApiBaseUrl(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    buildTarget: process.env.NEXT_PUBLIC_APP_MODE || process.env.BUILD_TARGET || 'unknown',
  };
};
