import AsyncStorage from '@react-native-async-storage/async-storage';
import {getApiBaseUrl} from './storage';
import {apiClient} from './client';

const AUTH_TOKEN_KEY = 'auth_token';
const OAUTH_STATE_DELIMITER = '::';
const pendingOAuthStates = new Set<string>();

export interface AuthResponse {
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

export interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  color: string;
  available: boolean;
  flows: {
    web: boolean;
    mobile: boolean;
  };
}

export interface AuthorizeUrlResponse {
  authorization_url: string;
}

export interface FinalizeOAuthPayload {
  providerId: string;
  code?: string | null;
  token?: string | null;
  state?: string | null;
}

export const storeAuthToken = async (token: string) => {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
};

const removeAuthToken = async () => {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
};

export const createOAuthState = (providerId: string): string => {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${providerId}${OAUTH_STATE_DELIMITER}${randomPart}`;
};

export const recordPendingOAuthState = (state: string) => {
  pendingOAuthStates.add(state);
};

export const consumePendingOAuthState = (state?: string | null): boolean => {
  if (!state) {
    return false;
  }
  if (pendingOAuthStates.has(state)) {
    pendingOAuthStates.delete(state);
    return true;
  }
  return false;
};

export const extractProviderFromState = (state?: string | null): string | null => {
  if (!state || !state.includes(OAUTH_STATE_DELIMITER)) {
    return null;
  }
  return state.split(OAUTH_STATE_DELIMITER)[0] || null;
};

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
      await storeAuthToken(data.access_token);
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
      await storeAuthToken(data.access_token);
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
  await removeAuthToken();
};

export const fetchOAuthProviders = async (): Promise<OAuthProvider[]> => {
  try {
    const providers = await apiClient.get<OAuthProvider[]>(
      '/auth/providers?flow=mobile',
    );
    return providers.filter(provider => provider.available);
  } catch (error) {
    console.error('Failed to load OAuth providers', error);
    return [];
  }
};

export const getOAuthAuthorizationUrl = async (
  providerId: string,
  state?: string,
): Promise<string> => {
  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('API base URL not configured');
  }

  const params = new URLSearchParams();
  if (state) {
    params.append('state', state);
  }

  const query = params.toString();
  const response = await fetch(
    `${baseUrl}/oauth/authorize/${providerId}/mobile${
      query ? `?${query}` : ''
    }`,
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      detail || `Failed to get authorization URL for ${providerId}`,
    );
  }

  const payload: AuthorizeUrlResponse = await response.json();
  return payload.authorization_url;
};

export const finalizeOAuthLogin = async (
  payload: FinalizeOAuthPayload,
): Promise<AuthResponse> => {
  const {providerId, code, token, state} = payload;
  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) {
    throw new Error('API base URL not configured');
  }

  const params = new URLSearchParams();
  params.append('flow', 'mobile');
  if (code) {
    params.append('code', code);
  }
  if (token) {
    params.append('token', token);
  }
  if (state) {
    params.append('state', state);
  }

  const response = await fetch(
    `${baseUrl}/auth/callback/${providerId}?${params.toString()}`,
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'OAuth callback failed');
  }

  const data: AuthResponse = await response.json();
  if (data.access_token) {
    await storeAuthToken(data.access_token);
  }
  return data;
};
