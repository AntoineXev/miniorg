"use client";

import { useToast } from "@/providers/toast";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiClientOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  headers?: Record<string, string>;
  body?: unknown;
  successMessage?: string;
  errorMessage?: string;
};

type ApiClientResponse<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: ApiError;
};

/**
 * Wrapper pour les appels API avec gestion automatique des erreurs
 * 
 * @example
 * const { data, error } = await apiClient<{ id: string }>("/api/tasks", {
 *   method: "POST",
 *   body: { title: "New task" },
 *   successMessage: "Tâche créée",
 * });
 */
export async function apiClient<T = unknown>(
  url: string,
  options: ApiClientOptions = {}
): Promise<ApiClientResponse<T>> {
  const {
    method = "GET",
    headers = {},
    body,
    successMessage,
    errorMessage,
  } = options;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    let data: T;
    const contentType = response.headers.get("content-type");
    
    try {
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Si pas de JSON, retourner un objet vide
        data = {} as T;
      }
    } catch (parseError) {
      // Si le parsing échoue, retourner un objet vide
      data = {} as T;
    }

    if (!response.ok) {
      // Essayer d'extraire un message d'erreur du body si c'est un objet
      let errorMsg = errorMessage || `Erreur ${response.status}: ${response.statusText}`;
      if (data && typeof data === "object" && "message" in data) {
        errorMsg = String(data.message);
      } else if (data && typeof data === "object" && "error" in data) {
        errorMsg = String(data.error);
      }

      const error = new ApiError(errorMsg, response.status, data);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    if (error instanceof ApiError) {
      return { data: null, error };
    }

    const apiError = new ApiError(
      errorMessage || "Une erreur est survenue lors de la requête",
      0,
      error
    );
    return { data: null, error: apiError };
  }
}

/**
 * Version avec gestion automatique des toasts
 * Nécessite que useToast soit disponible dans le contexte
 */
export async function apiClientWithToast<T = unknown>(
  url: string,
  options: ApiClientOptions & {
    pushSuccess?: (title: string, description?: string) => void;
    pushError?: (title: string, description?: string) => void;
  } = {}
): Promise<T | null> {
  const { pushSuccess, pushError, successMessage, errorMessage, ...apiOptions } = options;

  const { data, error } = await apiClient<T>(url, apiOptions);

  if (error) {
    if (pushError) {
      pushError(
        errorMessage || "Erreur",
        error.status > 0
          ? `Erreur ${error.status}: ${error.message}`
          : error.message
      );
    }
    return null;
  }

  if (data && successMessage && pushSuccess) {
    pushSuccess(successMessage);
  }

  return data;
}

/**
 * Hook personnalisé qui combine useToast avec apiClientWithToast
 * Simplifie l'usage en évitant de passer pushToast manuellement
 * 
 * @example
 * const api = useApiClient();
 * const data = await api.post("/api/tasks", { title: "New task" }, "Tâche créée");
 */
export function useApiClient() {
  const { pushSuccess, pushError } = useToast();

  return {
    get: <T = unknown>(url: string, options?: Omit<ApiClientOptions, "method" | "body">) =>
      apiClientWithToast<T>(url, { ...options, method: "GET", pushSuccess, pushError }),

    post: <T = unknown>(
      url: string,
      body?: unknown,
      successMessage?: string,
      options?: Omit<ApiClientOptions, "method" | "body" | "successMessage">
    ) =>
      apiClientWithToast<T>(url, {
        ...options,
        method: "POST",
        body,
        successMessage,
        pushSuccess,
        pushError,
      }),

    patch: <T = unknown>(
      url: string,
      body?: unknown,
      successMessage?: string,
      options?: Omit<ApiClientOptions, "method" | "body" | "successMessage">
    ) =>
      apiClientWithToast<T>(url, {
        ...options,
        method: "PATCH",
        body,
        successMessage,
        pushSuccess,
        pushError,
      }),

    delete: <T = unknown>(
      url: string,
      successMessage?: string,
      options?: Omit<ApiClientOptions, "method" | "body" | "successMessage">
    ) =>
      apiClientWithToast<T>(url, {
        ...options,
        method: "DELETE",
        successMessage,
        pushSuccess,
        pushError,
      }),

    put: <T = unknown>(
      url: string,
      body?: unknown,
      successMessage?: string,
      options?: Omit<ApiClientOptions, "method" | "body" | "successMessage">
    ) =>
      apiClientWithToast<T>(url, {
        ...options,
        method: "PUT",
        body,
        successMessage,
        pushSuccess,
        pushError,
      }),
  };
}
