import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Check, X, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useCreateRoom } from '../../room/hooks/useRoomActions';
import type { Restaurant } from '../../../types/restaurant';

interface RestaurantListProps {
  restaurants: Restaurant[];
  onSelect: (restaurant: Restaurant) => void;
}

/**
 * 개별 식당 카드 컴포넌트
 * Intersection Observer를 사용하여 화면에 보일 때만 iframe을 로드합니다.
 */
const RestaurantCard: React.FC<{
  rest: Restaurant;
  isSelected: boolean;
  selectMode: boolean;
  onSelect: (restaurant: Restaurant) => void;
  toggleSelection: (id: string) => void;
}> = ({ rest, isSelected, selectMode, onSelect, toggleSelection }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 카드 바깥을 클릭하면 인터랙션 모드 해제
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsInteracting(false);
      }
    };

    if (isInteracting) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isInteracting]);

  const url = rest.urls?.[0];
  const getKakaoPlaceId = (urlStr: string): string | null => {
    const match = urlStr.match(/place\.map\.kakao\.com\/(\d+)/);
    return match ? match[1] : null;
  };
  const kakaoPlaceId = url ? getKakaoPlaceId(url) : null;

  return (
    <div
      ref={cardRef}
      className={`
        w-full bg-white border-2 rounded-3xl overflow-hidden shadow-sm transition-all flex flex-col text-left
        ${selectMode && isSelected
          ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-100'
          : 'border-gray-100 hover:border-orange-200'
        }
      `}
    >
      {/* 상단 정보 영역: 이름과 거리만 표기 */}
      <div 
        className="p-5 flex justify-between items-center cursor-pointer active:bg-gray-50 transition-colors"
        onClick={() => selectMode ? toggleSelection(rest.id) : onSelect(rest)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {selectMode && (
            <div
              className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                ${isSelected
                  ? 'bg-purple-500 border-purple-500'
                  : 'bg-white border-gray-300'
                }
              `}
            >
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </div>
          )}
          <h3 className="text-xl font-black text-gray-900 truncate tracking-tight">{rest.name}</h3>
        </div>
        
        <div className="flex items-center text-gray-400 font-bold text-sm shrink-0">
          <MapPin className="w-4 h-4 mr-1 text-orange-500" />
          <span>{rest.distance ? `${(rest.distance / 1000).toFixed(1)}km` : ''}</span>
        </div>
      </div>

      {/* 미리보기 영역: iframe 상시 노출 (지연 로딩 적용) */}
      <div className="w-full aspect-[4/5] bg-gray-50 border-t border-gray-100 relative">
        {kakaoPlaceId && isVisible ? (
          <div className="w-full h-full relative">
            <iframe
              src={`https://place.map.kakao.com/m/${kakaoPlaceId}`}
              className={`w-full h-full border-0 transition-opacity duration-300 ${!isInteracting ? 'opacity-90 pointer-events-none' : 'opacity-100'}`}
              title={`${rest.name} 미리보기`}
              loading="lazy"
            />
            
            {/* 인터랙션 방지 오버레이 (선택 모드가 아닐 때만 작동) */}
            {!selectMode && !isInteracting && (
              <div 
                className="absolute inset-0 bg-gray-900/5 flex items-center justify-center cursor-pointer hover:bg-gray-900/10 transition-colors z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsInteracting(true);
                }}
              >
                <div className="bg-white/90 backdrop-blur-sm px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-gray-100 animate-in fade-in zoom-in duration-300">
                  <span className="text-xs font-black text-gray-700">탭하여 상세보기</span>
                </div>
              </div>
            )}
            
            {/* 선택 모드일 때의 투명 레이어 */}
            {selectMode && (
              <div 
                className="absolute inset-0 z-30 cursor-pointer" 
                onClick={() => toggleSelection(rest.id)}
              />
            )}
          </div>
        ) : !kakaoPlaceId ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
            <ExternalLink className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs font-medium">미리보기를 지원하지 않는 식당입니다.</p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-orange-400 rounded-full animate-spin" />
            <p className="text-xs font-bold">상세 정보 불러오는 중...</p>
          </div>
        )}
      </div>
    </div>
  );
};

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
      <div className="space-y-8">
        {restaurants.map((rest) => (
          <RestaurantCard
            key={rest.id}
            rest={rest}
            isSelected={selectedRestaurants.has(rest.id)}
            selectMode={selectMode}
            onSelect={onSelect}
            toggleSelection={toggleSelection}
          />
        ))}
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