import type { ApiResponse } from './common';

export type MenuCategory = 
  | 'korean' 
  | 'chinese' 
  | 'japanese' 
  | 'western' 
  | 'asian' 
  | 'cafe' 
  | 'fast_food' 
  | 'fusion' 
  | 'buffet' 
  | 'other';

export type MainBase = 
  | 'rice' 
  | 'noodle' 
  | 'bread' 
  | 'meat' 
  | 'seafood' 
  | 'vegetable' 
  | 'etc';

export type Temperature = 'hot' | 'cold' | 'neutral';

export type Heaviness = 1 | 2 | 3; // Light(1), Medium(2), Heavy(3)

export interface MenuRecommendRequest {
  included_categories?: MenuCategory[];
  excluded_categories?: MenuCategory[];
  attributes?: {
    main_base?: MainBase | MainBase[];
    spiciness?: number;
    temperature?: Temperature;
    heaviness?: Heaviness;
  };
  limit?: number;
}

export interface Menu {
  id: string;
  name: string;
  category: string;
  description?: string;
  main_base?: string;
  spiciness?: number;
  temperature?: string;
  heaviness?: number;
  tags?: string[];
  search_keywords?: string[];
}

export type MenuRecommendResponse = ApiResponse<Menu[]>;