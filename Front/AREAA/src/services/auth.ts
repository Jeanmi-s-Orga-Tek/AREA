/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** auth
*/

const API_BASE_URL = "http://localhost:8080";
const TOKEN_KEY = "auth_token";

export interface RegisterData {
  email: string;
  new_password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface AuthError {
  detail: string;
}

export interface OAuthProvider {
  web: boolean;
  mobile: boolean;
}

export interface OAuthProviders {
  [key: string]: OAuthProvider;
}

export async function register(data: RegisterData): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as AuthError;
      throw new Error(errorData.detail || "Registration failed");
    }
    
    const authData = (await response.json()) as AuthResponse;
    if (authData.access_token) {
      localStorage.setItem(TOKEN_KEY, authData.access_token);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error during registration");
  }
}


export async function login(data: LoginData): Promise<void> {
  try {
    const formData = new URLSearchParams();
    formData.append("username", data.email);
    formData.append("password", data.password);

    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as AuthError;
      throw new Error(errorData.detail || "Login failed");
    }

    const authData = (await response.json()) as AuthResponse;
    localStorage.setItem(TOKEN_KEY, authData.access_token);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error during login");
  }
}


export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}


export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}


export async function fetchOAuthProviders(): Promise<OAuthProviders> {
  try {
    const response = await fetch(`${API_BASE_URL}/oauth/providers`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch OAuth providers");
    }

    return (await response.json()) as OAuthProviders;
  } catch (error) {
    console.error("Error fetching OAuth providers:", error);
    return {};
  }
}

export function getOAuthAuthUrl(provider: string): string {
  return `${API_BASE_URL}/oauth/authorize/${provider}/web`;
}
