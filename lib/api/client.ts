// API Client wrapper for fetch with centralized error handling
export class ApiClient {
  static async get<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to fetch ${url}: ${error}`);
    }
    return res.json();
  }

  static async post<T>(url: string, data: any): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to post to ${url}: ${error}`);
    }
    return res.json();
  }

  static async patch<T>(url: string, data: any): Promise<T> {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to patch ${url}: ${error}`);
    }
    return res.json();
  }

  static async delete(url: string): Promise<void> {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to delete ${url}: ${error}`);
    }
  }
}
