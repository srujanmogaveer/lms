/**
 * Central API Client configuration for EduSphere LMS.
 * Provides unified HTTP communication to the Node.js / Express backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    hasMore?: boolean;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  errors?: any;
  timestamp: string;
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('supabase_access_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: response.statusText || 'Failed to parse JSON response',
    timestamp: new Date().toISOString(),
  }));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  get: <T = any>(endpoint: string, paramsOrOptions?: Record<string, any> | RequestInit, options?: RequestInit) => {
    let finalEndpoint = endpoint;
    let finalOptions: RequestInit = {};

    if (paramsOrOptions) {
      if ('headers' in paramsOrOptions || 'signal' in paramsOrOptions || 'credentials' in paramsOrOptions) {
        finalOptions = paramsOrOptions as RequestInit;
      } else {
        const params = paramsOrOptions as Record<string, any>;
        const queryParts: string[] = [];
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
          }
        });
        if (queryParts.length > 0) {
          const separator = endpoint.includes('?') ? '&' : '?';
          finalEndpoint = `${endpoint}${separator}${queryParts.join('&')}`;
        }
        if (options) {
          finalOptions = options;
        }
      }
    }

    return apiClient<T>(finalEndpoint, { method: 'GET', ...finalOptions });
  },
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { method: 'DELETE', ...options }),
  
  // Multipart FormData file upload
  upload: async <T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> => {
    const token = localStorage.getItem('supabase_access_token');
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: response.statusText || 'Failed to parse JSON response',
      timestamp: new Date().toISOString(),
    }));

    if (!response.ok) {
      throw new Error(data.message || `Upload failed with status ${response.status}`);
    }

    return data;
  },

  // Foundation health check helper
  checkHealth: () => apiClient('/health'),
};
