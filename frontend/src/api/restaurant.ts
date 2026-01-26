import { client } from './client';
import type { 
  RestaurantSearchRequest, 
  RestaurantSearchResponse, 
  RestaurantCrawlRequest, 
  RestaurantDetailResponse 
} from '../types/restaurant';

export const restaurantApi = {
  search: async (data: RestaurantSearchRequest): Promise<RestaurantSearchResponse> => {
    const response = await client.post<RestaurantSearchResponse>('/restaurant/search', data);
    return response.data;
  },

  getDetail: async (data: RestaurantCrawlRequest): Promise<RestaurantDetailResponse> => {
    const response = await client.post<RestaurantDetailResponse>('/restaurant/detail', data);
    return response.data;
  },
};
