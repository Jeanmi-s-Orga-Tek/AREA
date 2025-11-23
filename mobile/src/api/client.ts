import {getApiBaseUrl} from './storage';

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

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
}

export const apiClient = new ApiClient();
