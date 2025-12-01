import {apiClient} from './client';

export interface ServiceBasicInfo {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  icon_url?: string;
}

export interface ActionInfo {
  id: number;
  name: string;
  description?: string;
  is_polling?: boolean;
  service_id: number;
}

export interface ReactionInfo {
  id: number;
  name: string;
  description?: string;
  url?: string;
  service_id: number;
}

export interface AreaActionDetail {
  service: ServiceBasicInfo;
  action: ActionInfo;
}

export interface AreaReactionDetail {
  service: ServiceBasicInfo;
  reaction: ReactionInfo;
}

export interface AreaDetail {
  id: number;
  name?: string;
  action: AreaActionDetail;
  reaction: AreaReactionDetail;
  action_parameters: Record<string, any>;
  reaction_parameters: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAreaRequest {
  name?: string;
  action_service_id: number;
  action_id: number;
  action_parameters?: Record<string, any>;
  reaction_service_id: number;
  reaction_id: number;
  reaction_parameters?: Record<string, any>;
  is_active?: boolean;
}

export const fetchAreas = async (): Promise<AreaDetail[]> => {
  return await apiClient.get<AreaDetail[]>('/areas');
};

export const createArea = async (
  payload: CreateAreaRequest,
): Promise<AreaDetail> => {
  return await apiClient.post<AreaDetail>('/areas/', payload);
};

export const toggleArea = async (areaId: number): Promise<AreaDetail> => {
  return await apiClient.patch<AreaDetail>(`/areas/${areaId}/toggle`);
};
