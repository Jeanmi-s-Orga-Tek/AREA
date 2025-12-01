import {apiClient} from './client';

export interface ServiceSummary {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  oauth_provider?: string;
  category?: string;
}

export interface ServiceAccountSummary {
  id: number;
  service: {
    id: number;
    name: string;
    display_name: string;
    icon?: string;
    color?: string;
  };
  remote_email?: string;
  remote_name?: string;
  granted_scopes?: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface ServiceConnectionPayload {
  serviceName: string;
  code?: string | null;
  token?: string | null;
}

export interface ServiceConnectionEvent {
  serviceName: string;
  success: boolean;
  error?: string;
}

export const SERVICE_OAUTH_EVENT = 'service-oauth-complete';

export const fetchServices = async (): Promise<ServiceSummary[]> => {
  return await apiClient.get<ServiceSummary[]>('/services');
};

export const fetchConnectedServices = async (): Promise<ServiceAccountSummary[]> => {
  return await apiClient.get<ServiceAccountSummary[]>('/services/my');
};

export const completeServiceConnection = async (
  payload: ServiceConnectionPayload,
): Promise<void> => {
  const {serviceName, code, token} = payload;
  const authorizationCode = code || token;

  if (!authorizationCode) {
    throw new Error('Missing authorization code for service connection.');
  }

  await apiClient.post(
    `/services/${serviceName}/connect?code=${encodeURIComponent(
      authorizationCode,
    )}&flow=mobile`,
  );
};

export const disconnectService = async (serviceId: number): Promise<void> => {
  await apiClient.delete(`/services/${serviceId}/disconnect`);
};
