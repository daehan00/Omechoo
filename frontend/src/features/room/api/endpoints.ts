import { roomClient, roomTokenUtils } from './client';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomDetailResponse,
  VoteResponse,
  CloseRoomResponse,
  Room,
} from '../types';

// 방 생성
export const createRoom = async (data: CreateRoomRequest): Promise<CreateRoomResponse> => {
  const response = await roomClient.post<CreateRoomResponse>('/rooms', data);
  // 토큰 자동 저장
  roomTokenUtils.save(response.data.room_id, response.data.token);
  return response.data;
};

// 방 조회
export const getRoom = async (roomId: string): Promise<RoomDetailResponse> => {
  const token = roomTokenUtils.get(roomId);
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await roomClient.get<RoomDetailResponse>(`/rooms/${roomId}`, { headers });
  return response.data;
};

// 방 참여
export const joinRoom = async (roomId: string, data: JoinRoomRequest): Promise<JoinRoomResponse> => {
  const response = await roomClient.post<JoinRoomResponse>(`/rooms/${roomId}/join`, data);
  // 토큰 자동 저장
  roomTokenUtils.save(roomId, response.data.token);
  return response.data;
};

// 투표 시작 (방장 전용)
export const startVoting = async (roomId: string): Promise<Room> => {
  const token = roomTokenUtils.get(roomId);
  const response = await roomClient.post<Room>(`/rooms/${roomId}/start`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// 투표하기
export const castVote = async (roomId: string, candidateId: string): Promise<VoteResponse> => {
  const token = roomTokenUtils.get(roomId);
  const response = await roomClient.post<VoteResponse>(
    `/rooms/${roomId}/vote`,
    { candidate_id: candidateId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// 투표 변경 또는 취소 (null이면 취소)
export const changeVote = async (roomId: string, newCandidateId: string | null): Promise<VoteResponse> => {
  const token = roomTokenUtils.get(roomId);
  const response = await roomClient.patch<VoteResponse>(
    `/rooms/${roomId}/vote`,
    { new_candidate_id: newCandidateId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// 투표 종료 (방장 전용)
export const closeRoom = async (roomId: string): Promise<CloseRoomResponse> => {
  const token = roomTokenUtils.get(roomId);
  const response = await roomClient.post<CloseRoomResponse>(`/rooms/${roomId}/close`, null, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
