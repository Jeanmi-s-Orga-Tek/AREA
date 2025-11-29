/*
** EPITECH PROJECT, 2025
** AREA
** File description:
** api
*/

import { getToken } from "./auth";

const API_BASE_URL = "http://localhost:8080";
const ABOUT_URL = "http://localhost:8080/about.json";

// ============================================================
// TYPES
// ============================================================

export interface AboutAction {
  name: string;
  description: string;
}

export interface AboutReaction {
  name: string;
  description: string;
}

export interface AboutService {
  name: string;
  actions: AboutAction[];
  reactions: AboutReaction[];
}

export interface AboutServer {
  current_time: number;
  services: AboutService[];
}

export interface AboutClient {
  host: string;
}

export interface AboutResponse {
  client: AboutClient;
  server: AboutServer;
}

export interface Service {
  id: number;
  name: string;
  display_name: string;
  description: string;
  icon: string;
  color: string;
  oauth_provider?: string;
  category?: string;
}

export interface ServiceAccount {
  id: number;
  service: {
    id: number;
    name: string;
    display_name: string;
    icon: string;
    color: string;
  };
  remote_email?: string;
  remote_name?: string;
  granted_scopes?: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface ServiceAction {
  id: number;
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface ServiceReaction {
  id: number;
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface ServiceCapabilities {
  service: Service;
  actions: ServiceAction[];
  reactions: ServiceReaction[];
}

export interface Area {
  id: number;
  name: string;
  is_active: boolean;
  action_service_id: number;
  action_id: number;
  action_parameters?: Record<string, any>;
  reaction_service_id: number;
  reaction_id: number;
  reaction_parameters?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AreaDetail {
  id: number;
  name: string;
  is_active: boolean;
  action: {
    service: Service;
    action: ServiceAction;
    parameters?: Record<string, any>;
  };
  reaction: {
    service: Service;
    reaction: ServiceReaction;
    parameters?: Record<string, any>;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateAreaRequest {
  name: string;
  action_service_id: number;
  action_id: number;
  action_parameters?: Record<string, any>;
  reaction_service_id: number;
  reaction_id: number;
  reaction_parameters?: Record<string, any>;
}

export interface User {
  id: number;
  email: string;
  name: string;
  image?: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }
  return response.json();
}

// ============================================================
// ABOUT ENDPOINT
// ============================================================

export async function fetchAbout(): Promise<AboutResponse> {
  try {
    const response = await fetch(ABOUT_URL, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch /about.json: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as AboutResponse;
    return data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`Unable to reach /about.json: ${message}`);
  }
}

// ============================================================
// USER API
// ============================================================

export async function fetchCurrentUser(): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/user/me`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<User>(response);
}

// ============================================================
// SERVICES API
// ============================================================

export async function fetchServices(): Promise<Service[]> {
  const response = await fetch(`${API_BASE_URL}/services/`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<Service[]>(response);
}

export async function fetchMyConnectedServices(): Promise<ServiceAccount[]> {
  const response = await fetch(`${API_BASE_URL}/my/services`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ServiceAccount[]>(response);
}

export async function fetchServiceCapabilities(serviceId: number): Promise<ServiceCapabilities> {
  const response = await fetch(`${API_BASE_URL}/services/${serviceId}/capabilities`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<ServiceCapabilities>(response);
}

export async function connectService(serviceName: string, code: string, flow: string = "web"): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/services/${serviceName}/connect?code=${code}&flow=${flow}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  await handleResponse<void>(response);
}

export async function disconnectService(serviceAccountId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/services/${serviceAccountId}/disconnect`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await handleResponse<void>(response);
}

// ============================================================
// AREAS API
// ============================================================

export async function fetchMyAreas(): Promise<AreaDetail[]> {
  const response = await fetch(`${API_BASE_URL}/areas`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<AreaDetail[]>(response);
}

export async function fetchAreaById(areaId: number): Promise<AreaDetail> {
  const response = await fetch(`${API_BASE_URL}/areas/${areaId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<AreaDetail>(response);
}

export async function createArea(data: CreateAreaRequest): Promise<AreaDetail> {
  const response = await fetch(`${API_BASE_URL}/areas/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<AreaDetail>(response);
}

export async function updateArea(areaId: number, data: Partial<CreateAreaRequest>): Promise<AreaDetail> {
  const response = await fetch(`${API_BASE_URL}/areas/${areaId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<AreaDetail>(response);
}

export async function toggleAreaStatus(areaId: number, isActive: boolean): Promise<AreaDetail> {
  const response = await fetch(`${API_BASE_URL}/areas/${areaId}/toggle`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_active: isActive }),
  });
  return handleResponse<AreaDetail>(response);
}

export async function deleteArea(areaId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/areas/${areaId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await handleResponse<void>(response);
}
