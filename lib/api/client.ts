import { isTauri, getApiUrl } from "@/lib/platform";

// Storage key for JWT token
const JWT_TOKEN_KEY = "miniorg_jwt_token";

// API Client wrapper for fetch with centralized error handling
export class ApiClient {
  /**
   * Get the stored JWT token (Tauri only)
   */
  private static getAuthToken(): string | null {
    if (typeof window === "undefined" || !isTauri()) return null;
    return localStorage.getItem(JWT_TOKEN_KEY);
  }

  /**
   * Set the JWT token (Tauri only)
   */
  static setAuthToken(token: string): void {
    if (typeof window === "undefined" || !isTauri()) return;
    localStorage.setItem(JWT_TOKEN_KEY, token);
  }

  /**
   * Clear the JWT token (logout)
   */
  static clearAuthToken(): void {
    if (typeof window === "undefined" || !isTauri()) return;
    localStorage.removeItem(JWT_TOKEN_KEY);
  }

  /**
   * Get headers with auth token if in Tauri mode
   */
  private static getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add JWT token for Tauri requests
    if (isTauri()) {
      const token = this.getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Normalize URL for the current platform
   */
  private static normalizeUrl(url: string): string {
    if (isTauri()) {
      return getApiUrl(url);
    }
    return url;
  }

  static async get<T>(url: string): Promise<T> {
    const normalizedUrl = this.normalizeUrl(url);
    const res = await fetch(normalizedUrl, {
      method: "GET",
      headers: this.getHeaders(),
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to fetch ${url}: ${error}`);
    }
    return res.json();
  }

  static async post<T>(url: string, data: any): Promise<T> {
    const normalizedUrl = this.normalizeUrl(url);
    const res = await fetch(normalizedUrl, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to post to ${url}: ${error}`);
    }
    return res.json();
  }

  static async patch<T>(url: string, data: any): Promise<T> {
    const normalizedUrl = this.normalizeUrl(url);
    const res = await fetch(normalizedUrl, {
      method: "PATCH",
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to patch ${url}: ${error}`);
    }
    return res.json();
  }

  static async delete(url: string): Promise<void> {
    const normalizedUrl = this.normalizeUrl(url);
    const res = await fetch(normalizedUrl, {
      method: "DELETE",
      headers: this.getHeaders(),
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to delete ${url}: ${error}`);
    }
  }
}
