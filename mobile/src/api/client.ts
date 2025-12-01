import {getApiBaseUrl} from './storage';
import {getAuthToken} from './auth';

export class ApiClient {
  private async getBaseUrl(): Promise<string> {
    const url = await getApiBaseUrl();
    if (!url) {
      throw new Error('API base URL not configured. Please set it in Settings.');
    }
    return url;
  }

  async get<T>(endpoint: string): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    const token = await getAuthToken();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && {Authorization: `Bearer ${token}`}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    const token = await getAuthToken();

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && {Authorization: `Bearer ${token}`}),
        },
        ...(body && {body: JSON.stringify(body)}),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  async post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    const token = await getAuthToken();

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const requestHeaders: Record<string, string> = {
      ...(token && {Authorization: `Bearer ${token}`}),
      ...(headers || {}),
    };

    if (!isFormData && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        ...(body !== undefined && {
          body:
            isFormData || typeof body === 'string'
              ? body
              : JSON.stringify(body),
        }),
      });

      if (!response.ok) {
        const message = await this.extractErrorMessage(response);
        throw new Error(message);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  private async extractErrorMessage(response: globalThis.Response): Promise<string> {
    try {
      const data = await response.json();
      if (typeof data === 'object' && data !== null) {
        if ('detail' in data && typeof data.detail === 'string') {
          return data.detail;
        }
        if ('message' in data && typeof data.message === 'string') {
          return data.message;
        }
      }
    } catch (error) {
      // ignore JSON parsing errors and fall back to status text
    }
    return `HTTP ${response.status}: ${response.statusText}`;
  }
}

export const apiClient = new ApiClient();
