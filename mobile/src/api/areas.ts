import {apiClient} from './client';

export interface AreaRead {
  id: number;
  user_id: number;
  action_service_id: number;
  action_id: number;
  reaction_service_id: number;
  reaction_id: number;
  params_action: Record<string, any>;
  params_reaction: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const fetchAreas = async (): Promise<AreaRead[]> => {
  return await apiClient.get<AreaRead[]>('/areas');
};

export const toggleArea = async (areaId: number): Promise<AreaRead> => {
  return await apiClient.patch<AreaRead>(`/areas/${areaId}/toggle`);
};
