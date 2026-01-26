import type { ApiResponse, Location } from './common';

export interface RestaurantSearchRequest {
  menu_id: string;
  latitude: number;
  longitude: number;
  radius_km?: number;
  max_result?: number;
}

export interface RestaurantCrawlRequest {
  url: string;
}

export interface LocationResponse extends Location {
  address?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  location?: LocationResponse;
  urls?: string[];
  menu_items?: string[];
  distance?: number;
}

export interface RestaurantMenu {
  name: string;
  price: string;
}

export interface RestaurantDetail {
  rating: string;
  review_count: string;
  blog_review_count: string;
  business_status: any[];
  menus: RestaurantMenu[];
}

export type RestaurantSearchResponse = ApiResponse<Restaurant[]>;

export type RestaurantDetailResponse = ApiResponse<RestaurantDetail>;
