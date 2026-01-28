import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useCreateRoom } from '../hooks/useRoomActions';
import type { CandidateInput, CandidateType } from '../types';

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const createRoom = useCreateRoom();

  const [name, setName] = useState('');
  const [hostNickname, setHostNickname] = useState('');
  const [candidateType, setCandidateType] = useState<CandidateType>('menu');
  const [candidates, setCandidates] = useState<CandidateInput[]>([
    { value: '' },
    { value: '' },
  ]);
  const [maxParticipants, setMaxParticipants] = useState(10);

  const addCandidate = () => {
    if (candidates.length < 10) {
      setCandidates([...candidates, { value: '' }]);
    }
  };

  const removeCandidate = (index: number) => {
    if (candidates.length > 2) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const updateCandidate = (index: number, value: string) => {
    const updated = [...candidates];
    updated[index] = { ...updated[index], value };
    setCandidates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    const validCandidates = candidates.filter((c) => c.value.trim());
    if (validCandidates.length < 2) {
      alert('후보를 최소 2개 이상 입력해주세요.');
      return;
    }

    try {
      const result = await createRoom.mutateAsync({
        name,
        host_nickname: hostNickname,
        candidate_type: candidateType,
        candidates: validCandidates,
        max_participants: maxParticipants,
      });

      // 방 생성 성공 시 해당 방으로 이동
      navigate(`/rooms/${result.room_id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('방 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const isValid =
    name.trim() &&
    hostNickname.trim() &&
    candidates.filter((c) => c.value.trim()).length >= 2;

  return (
    <div className="min-h-full bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 font-bold text-gray-900">투표방 만들기</h1>
        </div>
      </header>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 방 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            방 제목
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 점심 뭐먹지?"
            maxLength={50}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>

        {/* 닉네임 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            내 닉네임
          </label>
          <input
            type="text"
            value={hostNickname}
            onChange={(e) => setHostNickname(e.target.value)}
            placeholder="방장으로 표시될 이름"
            maxLength={20}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>

        {/* 후보 타입 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            투표 유형
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCandidateType('menu')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                candidateType === 'menu'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🍜 메뉴
            </button>
            <button
              type="button"
              onClick={() => setCandidateType('restaurant')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                candidateType === 'restaurant'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏪 식당
            </button>
          </div>
        </div>

        {/* 후보 목록 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            후보 목록 ({candidates.length}/10)
          </label>
          <div className="space-y-2">
            {candidates.map((candidate, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={candidate.value}
                  onChange={(e) => updateCandidate(index, e.target.value)}
                  placeholder={
                    candidateType === 'menu'
                      ? `후보 ${index + 1} (예: 짜장면)`
                      : `후보 ${index + 1} (예: 맛있는 식당)`
                  }
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
                {candidates.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeCandidate(index)}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {candidates.length < 10 && (
            <button
              type="button"
              onClick={addCandidate}
              className="mt-2 w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-orange-400 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              후보 추가
            </button>
          )}
        </div>

        {/* 최대 인원 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            참여 인원: {maxParticipants}명
          </label>
          <input
            type="range"
            min={2}
            max={50}
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>2명</span>
            <span>50명</span>
          </div>
        </div>

        {/* 제출 버튼 */}
        <Button
          type="submit"
          fullWidth
          size="lg"
          disabled={!isValid || createRoom.isPending}
          isLoading={createRoom.isPending}
        >
          투표방 만들기
        </Button>
      </form>
    </div>
  );
};

export default CreateRoomPage;
