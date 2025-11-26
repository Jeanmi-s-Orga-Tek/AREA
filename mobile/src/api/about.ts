import {apiClient} from './client';

export interface AboutResponse {
  client: {
    host: string;
  };
  server: {
    current_time: number;
    services: Array<{
      name: string;
      actions: Array<{
        name: string;
        description: string;
      }>;
      reactions: Array<{
        name: string;
        description: string;
      }>;
    }>;
  };
}

export const fetchAbout = async (): Promise<AboutResponse> => {
  return apiClient.get<AboutResponse>('/about.json');
};
