export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}
