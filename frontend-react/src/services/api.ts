/**
 * API Client Base
 * 
 * In production (same domain), use relative URLs
 * In development, use absolute URL (localhost:5000)
 */
const getApiUrl = (): string => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In production (same domain), use relative URL
  // This works because frontend and backend are served from the same domain
  if (import.meta.env.PROD) {
    return ''; // Relative URL - same domain
  }

  // Development fallback
  return 'http://localhost:5000';
};

const API_URL = getApiUrl();

class ApiError extends Error {
  status: number;
  response?: any;

  constructor(message: string, status: number, response?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

export const apiClient = {
  async get<T>(endpoint: string, options: { headers?: Record<string, string> } = {}): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      );
    }

    return response.json();
  },

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    console.log('[apiClient] POST', url, { data });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
    } catch (networkError: any) {
      console.error('[apiClient] Network error on POST', url, networkError);
      throw new ApiError(networkError.message || 'Network error', 0);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[apiClient] HTTP error on POST', url, response.status, errorData);
      throw new ApiError(
        errorData.error || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      );
    }

    const json = await response.json();
    console.log('[apiClient] POST success', url, json);
    return json;
  },

  async download(endpoint: string): Promise<Blob> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      );
    }

    return response.blob();
  },
};

export { ApiError };

