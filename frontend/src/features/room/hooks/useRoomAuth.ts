import { useState, useMemo, useCallback, useEffect } from 'react';
import { roomTokenUtils } from '../api/client';
import type { RoomTokenPayload } from '../types';

export const useRoomAuth = (roomId: string) => {
  // 토큰 변경을 감지하기 위한 상태
  const [tokenVersion, setTokenVersion] = useState(0);

  // 초기 로드 시 토큰 존재 여부 확인
  useEffect(() => {
    setTokenVersion((v) => v + 1);
  }, [roomId]);

  const saveToken = useCallback((token: string) => {
    roomTokenUtils.save(roomId, token);
    setTokenVersion((v) => v + 1); // 토큰 저장 시 상태 업데이트
  }, [roomId]);

  const getToken = useCallback(() => {
    return roomTokenUtils.get(roomId);
  }, [roomId]);

  const clearToken = useCallback(() => {
    roomTokenUtils.remove(roomId);
    setTokenVersion((v) => v + 1); // 토큰 삭제 시 상태 업데이트
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

  // 토큰 유효성 검사 (tokenVersion 의존성 추가로 변경 감지)
  const isAuthenticated = useMemo(() => {
    // tokenVersion을 참조하여 의존성 트리거
    void tokenVersion;
    const payload = decodeToken();
    if (!payload) return false;
    return payload.exp * 1000 > Date.now();
  }, [decodeToken, tokenVersion]);

  // 방장 여부
  const isHost = useMemo(() => {
    void tokenVersion;
    const payload = decodeToken();
    return payload?.is_host === true;
  }, [decodeToken, tokenVersion]);

  // 현재 닉네임
  const nickname = useMemo(() => {
    void tokenVersion;
    const payload = decodeToken();
    return payload?.nickname ?? null;
  }, [decodeToken, tokenVersion]);

  // participant_id
  const participantId = useMemo(() => {
    void tokenVersion;
    const payload = decodeToken();
    return payload?.participant_id ?? null;
  }, [decodeToken, tokenVersion]);

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
