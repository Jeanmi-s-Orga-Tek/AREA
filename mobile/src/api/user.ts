/*
** EPITECH PROJECT, 2026
** AREA
** File description:
** user
*/

import {apiClient} from './client';

export interface CurrentUser {
  id: number;
  email: string;
  name?: string;
}

export const fetchCurrentUser = async (): Promise<CurrentUser> => {
  return apiClient.get<CurrentUser>('/user/me');
};
