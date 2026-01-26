import { client } from './client';
import type { MenuRecommendRequest, MenuRecommendResponse } from '../types/menu';

export const menuApi = {
  getAllMenus: async (): Promise<MenuRecommendResponse> => {
    const response = await client.get<MenuRecommendResponse>('/menu/all');
    return response.data;
  },

  recommendBasic: async (data: MenuRecommendRequest): Promise<MenuRecommendResponse> => {
    const response = await client.post<MenuRecommendResponse>('/menu/recommend/basic', data);
    return response.data;
  },
};
