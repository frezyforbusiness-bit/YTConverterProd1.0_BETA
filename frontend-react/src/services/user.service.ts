import { apiClient, ApiError } from './api';

export interface UserAuthResponse {
  id: number;
  email: string;
  role: string;
  token: string;
}

export interface UserProfile {
  user_id: number;
  email: string;
  role: string;
}

export interface UserRegisterRequest {
  email: string;
  password: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

const USER_TOKEN_KEY = 'user_token';

const getToken = (): string | null => {
  return sessionStorage.getItem(USER_TOKEN_KEY);
};

const setToken = (token: string): void => {
  sessionStorage.setItem(USER_TOKEN_KEY, token);
};

const removeToken = (): void => {
  sessionStorage.removeItem(USER_TOKEN_KEY);
};

const getAuthHeaders = () => {
  const token = getToken();
  if (!token) {
    throw new ApiError('Not authenticated', 401);
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const userService = {
  register: async (payload: UserRegisterRequest): Promise<UserAuthResponse> => {
    const response = await apiClient.post<UserAuthResponse>('/api/auth/register', payload);
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  login: async (payload: UserLoginRequest): Promise<UserAuthResponse> => {
    const response = await apiClient.post<UserAuthResponse>('/api/auth/login', payload);
    if (response.token) {
      setToken(response.token);
    }
    return response;
  },

  logout: (): void => {
    removeToken();
  },

  isAuthenticated: (): boolean => {
    return !!getToken();
  },

  getProfile: async (): Promise<UserProfile> => {
    const headers = getAuthHeaders();
    return apiClient.get<UserProfile>('/api/auth/me', { headers } as any);
  },
};

