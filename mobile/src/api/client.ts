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
}

export const apiClient = new ApiClient();
