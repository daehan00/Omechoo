import { useQuery } from '@tanstack/react-query';
import { getRoom } from '../api/endpoints';
import type { RoomDetailResponse, RoomStatus } from '../types';

interface UseRoomOptions {
  enabled?: boolean;
}

// 상태별 폴링 간격 (ms)
const POLLING_INTERVALS: Record<RoomStatus, number | false> = {
  waiting: 3000,
  voting: 2000,
  closed: false, // 폴링 중단
};

export const useRoom = (roomId: string, options: UseRoomOptions = {}) => {
  const { enabled = true } = options;

  const query = useQuery<RoomDetailResponse>({
    queryKey: ['room', roomId],
    queryFn: () => getRoom(roomId),
    enabled: enabled && !!roomId,
    refetchOnWindowFocus: true,
    staleTime: 1000,
  });

  // 상태에 따라 폴링 간격 동적 설정
  const status = query.data?.room.status;
  const refetchInterval = status ? POLLING_INTERVALS[status] : 3000;

  // refetchInterval을 동적으로 적용
  const queryWithPolling = useQuery<RoomDetailResponse>({
    queryKey: ['room', roomId],
    queryFn: () => getRoom(roomId),
    enabled: enabled && !!roomId,
    refetchOnWindowFocus: true,
    refetchInterval: refetchInterval,
    staleTime: 1000,
  });

  return queryWithPolling;
};
