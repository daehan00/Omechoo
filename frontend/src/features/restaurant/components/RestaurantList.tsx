import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, ChevronRight, Users, Check, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useCreateRoom } from '../../room/hooks/useRoomActions';
import type { Restaurant } from '../../../types/restaurant';

interface RestaurantListProps {
  restaurants: Restaurant[];
  onSelect: (restaurant: Restaurant) => void;
}

export const RestaurantList: React.FC<RestaurantListProps> = ({ restaurants, onSelect }) => {
  const navigate = useNavigate();
  const createRoom = useCreateRoom();

  // 선택 모드 상태
  const [selectMode, setSelectMode] = useState(false);
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<string>>(new Set());

  // 닉네임 입력 모달
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [roomName, setRoomName] = useState('');

  // 식당 선택 토글
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedRestaurants);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (newSelected.size < 10) {
      newSelected.add(id);
    }
    setSelectedRestaurants(newSelected);
  };

  // 전체 선택 / 전체 해제
  const handleSelectAll = () => {
    if (selectedRestaurants.size === restaurants.length || selectedRestaurants.size === 10) {
      // 전체 해제
      setSelectedRestaurants(new Set());
    } else {
      // 전체 선택 (최대 10개)
      const allIds = restaurants.slice(0, 10).map(r => r.id);
      setSelectedRestaurants(new Set(allIds));
    }
  };

  // 선택 모드 시작
  const handleStartSelectMode = () => {
    setSelectMode(true);
    setSelectedRestaurants(new Set());
  };

  // 선택 모드 취소
  const handleCancelSelectMode = () => {
    setSelectMode(false);
    setSelectedRestaurants(new Set());
  };

  // 투표 방 만들기 (닉네임 모달 열기)
  const handleOpenCreateRoom = () => {
    if (selectedRestaurants.size < 2) {
      alert('투표 후보를 최소 2개 이상 선택해주세요.');
      return;
    }
    setRoomName('점심 어디갈까?');
    setShowNicknameModal(true);
  };

  // 실제 방 생성
  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    const selectedList = restaurants.filter(r => selectedRestaurants.has(r.id));
    const candidates = selectedList.map(rest => ({
      value: rest.urls?.[0] || rest.name,
      display_name: rest.name,
    }));

    try {
      const result = await createRoom.mutateAsync({
        name: roomName || '점심 어디갈까?',
        host_nickname: nickname.trim(),
        candidate_type: 'restaurant',
        candidates,
      });

      navigate(`/rooms/${result.room_id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('방 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="relative pb-24">
      <div className="space-y-4">
        {restaurants.map((rest) => {
          const isSelected = selectedRestaurants.has(rest.id);

          return (
            <button
              key={rest.id}
              onClick={() => selectMode ? toggleSelection(rest.id) : onSelect(rest)}
              className={`
                w-full bg-white border-2 rounded-3xl p-5 shadow-sm transition-all flex gap-5 text-left active:scale-[0.98]
                ${selectMode && isSelected
                  ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100'
                  : 'border-gray-100 hover:shadow-md hover:border-orange-200'
                }
              `}
            >
              {/* 선택 모드 체크박스 */}
              {selectMode && (
                <div
                  className={`
                    absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10
                    ${isSelected
                      ? 'bg-purple-500 border-purple-500'
                      : 'bg-white border-gray-300'
                    }
                  `}
                  style={{ position: 'relative', top: 0, right: 0, marginRight: -8, marginTop: -8 }}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              )}

              {/* Thumbnail Placeholder */}
              <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-gray-50">
                {rest.category.includes('한식') ? '🍚' : rest.category.includes('일식') ? '🍣' : rest.category.includes('중식') ? '🥢' : '🍽️'}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-black text-gray-900 truncate tracking-tight">{rest.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{rest.category}</p>
                </div>

                <div className="flex items-center gap-4 mt-auto">
                  <div className="flex items-center text-orange-500 font-bold text-sm">
                    <Star className="w-4 h-4 fill-orange-500 mr-1" />
                    <span>4.5</span>
                  </div>
                  <div className="flex items-center text-gray-400 font-medium text-sm">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{rest.distance ? `${(rest.distance / 1000).toFixed(1)}km` : ''}</span>
                  </div>

                  {!selectMode && (
                    <div className="ml-auto">
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Floating Action Button / 하단 버튼 영역 */}
      <div className="fixed bottom-6 right-6 z-30">
        {selectMode ? (
          // 선택 모드 버튼
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={handleCancelSelectMode}
              className="w-12 h-12 bg-gray-100 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-white border border-purple-300 text-purple-600 rounded-full shadow-lg font-medium text-sm hover:bg-purple-50 transition-colors"
            >
              {selectedRestaurants.size === restaurants.length || selectedRestaurants.size === 10 ? '전체 해제' : '전체 선택'}
            </button>
            <button
              onClick={handleOpenCreateRoom}
              disabled={selectedRestaurants.size < 2}
              className={`
                px-5 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold transition-all
                ${selectedRestaurants.size >= 2
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <Users className="w-5 h-5" />
              투표 방 만들기 ({selectedRestaurants.size})
            </button>
          </div>
        ) : (
          // 일반 모드 - 공유 버튼
          <button
            onClick={handleStartSelectMode}
            className="w-14 h-14 bg-purple-500 rounded-full shadow-xl flex items-center justify-center hover:bg-purple-600 active:scale-95 transition-all"
          >
            <Users className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* 닉네임 입력 모달 */}
      {showNicknameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              투표 방 만들기
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  방 제목
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="예: 점심 어디갈까?"
                  maxLength={50}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내 닉네임
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="방장으로 표시될 이름"
                  maxLength={20}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                  autoFocus
                />
              </div>

              <p className="text-xs text-gray-500">
                선택한 식당: {restaurants.filter(r => selectedRestaurants.has(r.id)).map(r => r.name).join(', ')}
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                fullWidth
                variant="secondary"
                onClick={() => setShowNicknameModal(false)}
              >
                취소
              </Button>
              <Button
                fullWidth
                onClick={handleCreateRoom}
                isLoading={createRoom.isPending}
                disabled={!nickname.trim()}
                className="bg-purple-500 hover:bg-purple-600"
              >
                방 만들기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};