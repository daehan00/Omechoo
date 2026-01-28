import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/v1', '') || '/api';

export const roomClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Room ID를 URL에서 추출하는 헬퍼
export const extractRoomIdFromUrl = (): string | null => {
  const match = window.location.pathname.match(/\/rooms\/([a-f0-9-]+)/);
  return match ? match[1] : null;
};

// 토큰 저장/조회/삭제 유틸
export const roomTokenUtils = {
  save: (roomId: string, token: string) => {
    localStorage.setItem(`room_token_${roomId}`, token);
  },
  get: (roomId: string): string | null => {
    return localStorage.getItem(`room_token_${roomId}`);
  },
  remove: (roomId: string) => {
    localStorage.removeItem(`room_token_${roomId}`);
  },
};

// 인터셉터: 토큰 자동 추가
roomClient.interceptors.request.use((config) => {
  const roomId = extractRoomIdFromUrl();
  if (roomId) {
    const token = roomTokenUtils.get(roomId);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 응답 에러 핸들링
roomClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Room API Error:', error);
    return Promise.reject(error);
  }
);
