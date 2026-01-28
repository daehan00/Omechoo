import { useMemo, useCallback } from 'react';
import { roomTokenUtils } from '../api/client';
import type { RoomTokenPayload } from '../types';

export const useRoomAuth = (roomId: string) => {
  const saveToken = useCallback((token: string) => {
    roomTokenUtils.save(roomId, token);
  }, [roomId]);

  const getToken = useCallback(() => {
    return roomTokenUtils.get(roomId);
  }, [roomId]);

  const clearToken = useCallback(() => {
    roomTokenUtils.remove(roomId);
  }, [roomId]);

  // JWT 페이로드 디코딩
  const decodeToken = useCallback((): RoomTokenPayload | null => {
    const token = getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload as RoomTokenPayload;
    } catch {
      return null;
    }
  }, [getToken]);

  // 토큰 유효성 검사
  const isAuthenticated = useMemo(() => {
    const payload = decodeToken();
    if (!payload) return false;
    return payload.exp * 1000 > Date.now();
  }, [decodeToken]);

  // 방장 여부
  const isHost = useMemo(() => {
    const payload = decodeToken();
    return payload?.is_host === true;
  }, [decodeToken]);

  // 현재 닉네임
  const nickname = useMemo(() => {
    const payload = decodeToken();
    return payload?.nickname ?? null;
  }, [decodeToken]);

  // participant_id
  const participantId = useMemo(() => {
    const payload = decodeToken();
    return payload?.participant_id ?? null;
  }, [decodeToken]);

  return {
    saveToken,
    getToken,
    clearToken,
    decodeToken,
    isAuthenticated,
    isHost,
    nickname,
    participantId,
  };
};
