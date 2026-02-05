import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { RoomLayout } from '../components/RoomLayout';
import { CandidateCard } from '../components/CandidateCard';
import { UserList } from '../components/UserList';
import { ShareButton } from '../components/ShareButton';
import { ResultChart } from '../components/ResultChart';
import { useRoom } from '../hooks/useRoom';
import { useRoomAuth } from '../hooks/useRoomAuth';
import {
  useJoinRoom,
  useStartVoting,
  useCastVote,
  useChangeVote,
  useCloseRoom,
} from '../hooks/useRoomActions';
import type { Candidate, CloseRoomResponse } from '../types';

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [closeResult, setCloseResult] = useState<CloseRoomResponse | null>(null);

  const { isAuthenticated, isHost, nickname: myNickname, saveToken } = useRoomAuth(roomId || '');
  const { data, isLoading, error, refetch } = useRoom(roomId || '', {
    enabled: !!roomId,
  });

  const joinRoom = useJoinRoom(roomId || '');
  const startVoting = useStartVoting(roomId || '');
  const castVote = useCastVote(roomId || '');
  const changeVote = useChangeVote(roomId || '');
  const closeRoom = useCloseRoom(roomId || '');

  // 인증 상태 확인
  useEffect(() => {
    if (data && !isAuthenticated && data.room.status !== 'closed') {
      setShowJoinModal(true);
    }
  }, [data, isAuthenticated]);

  // 입장 처리
  const handleJoin = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    try {
      const result = await joinRoom.mutateAsync({ nickname: nickname.trim() });
      // 토큰을 명시적으로 저장하여 useRoomAuth 상태 업데이트 트리거
      saveToken(result.token);
      setShowJoinModal(false);
      refetch();
    } catch (err: unknown) {
      console.error('Join room error:', err);
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error.response?.status === 409) {
        alert('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
      } else if (error.response?.status === 410) {
        alert('방이 만료되었습니다.');
        navigate('/');
      } else if (error.response?.status === 404) {
        alert('방을 찾을 수 없습니다.');
        navigate('/');
      } else {
        alert(error.response?.data?.detail || '입장에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 투표 시작 (방장)
  const handleStartVoting = async () => {
    try {
      await startVoting.mutateAsync();
    } catch (err) {
      console.error('Failed to start voting:', err);
      alert('투표 시작에 실패했습니다.');
    }
  };

  // 투표하기 / 취소하기
  const handleVote = async (candidate: Candidate) => {
    if (!isAuthenticated) {
      setShowJoinModal(true);
      return;
    }

    try {
      if (data?.my_vote === candidate.id) {
        // 같은 후보를 다시 클릭 → 투표 취소
        await changeVote.mutateAsync(null);
      } else if (data?.my_vote) {
        // 다른 후보 클릭 → 투표 변경
        await changeVote.mutateAsync(candidate.id);
      } else {
        // 첫 투표
        await castVote.mutateAsync(candidate.id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { detail?: string } } };
      if (error.response?.status === 409 && error.response?.data?.detail?.includes('Already voted')) {
        // 이미 투표함 - 변경 시도
        try {
          await changeVote.mutateAsync(candidate.id);
        } catch {
          alert('투표 변경에 실패했습니다.');
        }
      } else {
        alert('투표에 실패했습니다.');
      }
    }
  };

  // 투표 종료 (방장)
  const handleCloseVoting = async () => {
    if (!confirm('투표를 종료하시겠습니까? 종료 후에는 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const result = await closeRoom.mutateAsync();
      setCloseResult(result);
    } catch (err) {
      console.error('Failed to close room:', err);
      alert('투표 종료에 실패했습니다.');
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
          <p className="mt-2 text-gray-600">방 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            방을 찾을 수 없습니다
          </h2>
          <p className="text-gray-600 mb-6">
            삭제되었거나 만료된 방입니다.
          </p>
          <Button onClick={() => navigate('/')}>홈으로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const { room, participants, results } = data;
  const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
  const totalVotes = results.reduce((sum, r) => sum + r.vote_count, 0);

  // 승자 계산: closeResult에서 가져오거나, results에서 직접 계산
  const getWinner = () => {
    if (closeResult?.winner) return closeResult.winner;
    if (room.status !== 'closed' || results.length === 0) return null;
    
    // 1등 득표수
    const sortedResults = [...results].sort((a, b) => b.vote_count - a.vote_count);
    const topVoteCount = sortedResults[0]?.vote_count || 0;
    
    // 투표가 없으면 승자 없음
    if (topVoteCount === 0) return null;
    
    // 동점자가 있는지 확인
    const topCandidates = sortedResults.filter(r => r.vote_count === topVoteCount);
    if (topCandidates.length > 1) return null; // 동점
    
    return sortedResults[0]?.candidate || null;
  };
  
  const winner = getWinner();

  return (
    <>
      <RoomLayout roomName={room.name} status={room.status}>
        {/* 대기 상태 */}
        {room.status === 'waiting' && (
          <div className="space-y-6">
            {/* 공유 섹션 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">친구들을 초대하세요!</h3>
              <ShareButton shareUrl={shareUrl} roomName={room.name} />
            </div>

            {/* 참여자 목록 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <UserList participants={participants} />
            </div>

            {/* 후보 미리보기 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">투표 후보</h3>
              <div className="space-y-2">
                {room.candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="px-4 py-3 bg-gray-50 rounded-xl text-gray-700"
                  >
                    {candidate.display_name || candidate.value}
                  </div>
                ))}
              </div>
            </div>

            {/* 투표 시작 버튼 (방장) */}
            {isHost ? (
              <Button
                fullWidth
                size="lg"
                onClick={handleStartVoting}
                isLoading={startVoting.isPending}
                disabled={participants.length < 2}
              >
                {participants.length < 2
                  ? '최소 2명 이상 필요합니다'
                  : '투표 시작하기'}
              </Button>
            ) : (
              <div className="text-center py-4 bg-yellow-50 rounded-xl">
                <p className="text-yellow-700 font-medium">
                  방장이 투표를 시작할 때까지 기다려주세요...
                </p>
              </div>
            )}
          </div>
        )}

        {/* 투표 진행 중 */}
        {room.status === 'voting' && (
          <div className="pb-36">
            {/* 내 선택 표시 */}
            {myNickname && (
              <div className="text-center text-sm text-gray-600 mb-4">
                <span className="font-medium text-orange-600">{myNickname}</span>님, 투표해주세요!
              </div>
            )}

            {/* 후보 카드 목록 */}
            <div className="space-y-3">
              {room.candidates.map((candidate) => {
                const result = results.find((r) => r.candidate.id === candidate.id);
                const isMyVote = data.my_vote === candidate.id;
                return (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    isSelected={isMyVote}
                    voteCount={result?.vote_count || 0}
                    showVotes={true}
                    totalVotes={totalVotes}
                    onClick={() => handleVote(candidate)}
                    disabled={castVote.isPending || changeVote.isPending}
                    showCancelHint={isMyVote}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 투표 진행 중 - 하단 고정 푸터 */}
        {room.status === 'voting' && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-orange-50 via-orange-50 to-transparent pt-6 pb-6 px-4 z-20">
            <div className="max-w-lg mx-auto space-y-3">
              {/* 참여자 현황 */}
              <div className="bg-orange-500 p-4 rounded-xl shadow-md">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-orange-100">투표 현황</span>
                  <span className="font-bold text-white">
                    {totalVotes}/{participants.length}명 투표 완료
                  </span>
                </div>
              </div>

              {/* 투표 종료 버튼 (방장) */}
              {isHost && (
                <Button
                  fullWidth
                  size="lg"
                  variant="secondary"
                  onClick={handleCloseVoting}
                  isLoading={closeRoom.isPending}
                  className="shadow-lg"
                >
                  투표 종료하기
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 투표 종료 */}
        {room.status === 'closed' && (
          <div className="pb-32">
            <ResultChart
              results={results}
              winner={winner}
            />
          </div>
        )}

        {/* 투표 종료 - 하단 고정 푸터 */}
        {room.status === 'closed' && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-6 pb-6 px-4 z-20">
            <div className="max-w-lg mx-auto flex gap-3">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => navigate('/')}
                className="shadow-lg"
              >
                홈으로
              </Button>
              {room.candidate_type === 'restaurant' ? (
                // 식당 투표인 경우 - 1등 식당 카카오맵에서 보기
                <Button
                  fullWidth
                  onClick={() => {
                    if (winner?.value?.startsWith('http')) {
                      window.open(winner.value, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  disabled={!winner}
                  className="shadow-lg"
                >
                  카카오맵에서 보기
                </Button>
              ) : (
                // 메뉴 투표인 경우 - 주변 식당 찾기
                <Button
                  fullWidth
                  onClick={() => navigate('/restaurant/search')}
                  className="shadow-lg"
                >
                  주변 식당 찾기
                </Button>
              )}
            </div>
          </div>
        )}
      </RoomLayout>

      {/* 입장 모달 */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {room.name}
            </h2>
            <p className="text-gray-600 mb-6">
              닉네임을 입력하고 참여하세요!
            </p>

            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임 입력"
              maxLength={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => navigate('/')}
              >
                취소
              </Button>
              <Button
                fullWidth
                onClick={handleJoin}
                isLoading={joinRoom.isPending}
                disabled={!nickname.trim()}
              >
                입장하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoomPage;
