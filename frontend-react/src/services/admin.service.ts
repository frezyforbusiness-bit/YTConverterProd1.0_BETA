import { apiClient } from './api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
}

export interface DashboardStats {
  total_conversions: number;
  successful_conversions: number;
  conversions_today: number;
  errors_today: number;
  success_rate: number;
  by_format: Record<string, number>;
}

export interface Conversion {
  id: number;
  created_at: string;
  video_title: string;
  format: string;
  status: string;
  bpm?: number;
  key?: string;
}

export interface AdminError {
  id: number;
  created_at: string;
  error_type: string;
  error_message: string;
  youtube_url?: string;
}

export interface StatsByDate {
  dates: string[];
  totals: number[];
  successful: number[];
  failed: number[];
}

export interface Profile {
  username: string;
  last_login?: string;
}

const getAuthToken = (): string | null => {
  return sessionStorage.getItem('admin_token');
};

const setAuthToken = (token: string): void => {
  sessionStorage.setItem('admin_token', token);
};

const removeAuthToken = (): void => {
  sessionStorage.removeItem('admin_token');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${token}`,
  };
};

export const adminService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/admin/login', credentials);
    setAuthToken(response.token);
    return response;
  },

  logout: (): void => {
    removeAuthToken();
  },

  isAuthenticated: (): boolean => {
    return !!getAuthToken();
  },

  getDashboard: async (): Promise<DashboardStats> => {
    const headers = getAuthHeaders();
    return apiClient.get<DashboardStats>('/api/admin/dashboard', { headers } as any);
  },

  getRecentConversions: async (limit: number = 20): Promise<{ conversions: Conversion[] }> => {
    const headers = getAuthHeaders();
    return apiClient.get<{ conversions: Conversion[] }>(`/api/admin/recent-conversions?limit=${limit}`, { headers } as any);
  },

  getErrors: async (limit: number = 20): Promise<{ errors: AdminError[] }> => {
    const headers = getAuthHeaders();
    return apiClient.get<{ errors: AdminError[] }>(`/api/admin/errors?limit=${limit}`, { headers } as any);
  },

  getStatsByDate: async (days: number): Promise<StatsByDate> => {
    const headers = getAuthHeaders();
    return apiClient.get<StatsByDate>(`/api/admin/stats-by-date?days=${days}`, { headers } as any);
  },

  getProfile: async (): Promise<Profile> => {
    const headers = getAuthHeaders();
    return apiClient.get<Profile>('/api/admin/profile', { headers } as any);
  },
};

