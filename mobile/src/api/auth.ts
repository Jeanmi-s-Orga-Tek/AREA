import AsyncStorage from '@react-native-async-storage/async-storage';
import {getApiBaseUrl} from './storage';
import {apiClient} from './client';

const AUTH_TOKEN_KEY = 'auth_token';

interface AuthResponse {
  access_token?: string;
  token_type?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  token?: string;
}

export interface RegisterPayload {
  email: string;
  new_password: string;
  name: string;
}

export interface RegisterResult {
  success: boolean;
  error?: string;
  token?: string;
}

export const login = async (
  credentials: LoginCredentials,
): Promise<LoginResult> => {
  try {
    const baseUrl = await getApiBaseUrl();
    if (!baseUrl) {
      return {
        success: false,
        error: 'API base URL not configured',
      };
    }

    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${baseUrl}/user/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: response.status === 401 ? 'Invalid credentials' : errorText,
      };
    }

    const data: AuthResponse = await response.json();
    if (data.access_token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
    }

    return {success: true, token: data.access_token};
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
};

export const register = async (
  payload: RegisterPayload,
): Promise<RegisterResult> => {
  try {
    const data = await apiClient.post<AuthResponse>('/user/register', payload);

    if (data.access_token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
    }

    return {
      success: true,
      token: data.access_token,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
};

export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
};
