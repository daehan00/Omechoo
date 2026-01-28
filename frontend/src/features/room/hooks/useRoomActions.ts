import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRoom, joinRoom, startVoting, castVote, changeVote, closeRoom } from '../api/endpoints';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  VoteResponse,
  CloseRoomResponse,
  Room,
} from '../types';

export const useCreateRoom = () => {
  return useMutation<CreateRoomResponse, Error, CreateRoomRequest>({
    mutationFn: createRoom,
  });
};

export const useJoinRoom = (roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation<JoinRoomResponse, Error, JoinRoomRequest>({
    mutationFn: (data) => joinRoom(roomId, data),
    onSuccess: () => {
      // 방 정보 갱신
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    },
  });
};

export const useStartVoting = (roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Room, Error, void>({
    mutationFn: () => startVoting(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    },
  });
};

export const useCastVote = (roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation<VoteResponse, Error, string>({
    mutationFn: (candidateId) => castVote(roomId, candidateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    },
  });
};

export const useChangeVote = (roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation<VoteResponse, Error, string>({
    mutationFn: (newCandidateId) => changeVote(roomId, newCandidateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    },
  });
};

export const useCloseRoom = (roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation<CloseRoomResponse, Error, void>({
    mutationFn: () => closeRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
    },
  });
};
