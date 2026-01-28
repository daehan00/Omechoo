import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, MapPin, Utensils, Flame, ThermometerSun, ThermometerSnowflake, SearchX, Leaf, Weight, Home, Users, Check, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useCreateRoom } from '../../room/hooks/useRoomActions';
import type { Menu } from '../../../types/menu';

interface MenuResultProps {
  results: Menu[];
  loading: boolean;
  onRetry: () => void;
  onFindRestaurant: (menuId: string) => void;
  onHome: () => void;
}

const CATEGORY_MAP: Record<string, string> = {
  korean: '한식',
  japanese: '일식',
  chinese: '중식',
  western: '양식',
  asian: '아시안',
  fast_food: '패스트푸드',
  fusion: '퓨전',
  buffet: '뷔페',
  cafe: '카페',
  other: '기타',
};

export const MenuResult: React.FC<MenuResultProps> = ({ 
  results, 
  loading, 
  onRetry, 
  onFindRestaurant,
  onHome 
}) => {
  const navigate = useNavigate();
  const createRoom = useCreateRoom();
  
  // 선택 모드 상태
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMenus, setSelectedMenus] = useState<Set<string>>(new Set());
  
  // 닉네임 입력 모달
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [roomName, setRoomName] = useState('');

  // 메뉴 선택 토글
  const toggleMenuSelection = (menuId: string) => {
    const newSelected = new Set(selectedMenus);
    if (newSelected.has(menuId)) {
      newSelected.delete(menuId);
    } else if (newSelected.size < 10) {
      newSelected.add(menuId);
    }
    setSelectedMenus(newSelected);
  };

  // 전체 선택 / 전체 해제
  const handleSelectAll = () => {
    if (selectedMenus.size === results.length || selectedMenus.size === 10) {
      // 전체 해제
      setSelectedMenus(new Set());
    } else {
      // 전체 선택 (최대 10개)
      const allIds = results.slice(0, 10).map(m => m.id);
      setSelectedMenus(new Set(allIds));
    }
  };

  // 선택 모드 시작
  const handleStartSelectMode = () => {
    setSelectMode(true);
    setSelectedMenus(new Set());
  };

  // 선택 모드 취소
  const handleCancelSelectMode = () => {
    setSelectMode(false);
    setSelectedMenus(new Set());
  };

  // 투표 방 만들기 (닉네임 모달 열기)
  const handleOpenCreateRoom = () => {
    if (selectedMenus.size < 2) {
      alert('투표 후보를 최소 2개 이상 선택해주세요.');
      return;
    }
    setRoomName('점심 뭐먹지?');
    setShowNicknameModal(true);
  };

  // 실제 방 생성
  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    const selectedMenuList = results.filter(m => selectedMenus.has(m.id));
    const candidates = selectedMenuList.map(menu => ({
      value: menu.name,
      display_name: menu.description || undefined,
    }));

    try {
      const result = await createRoom.mutateAsync({
        name: roomName || '점심 뭐먹지?',
        host_nickname: nickname.trim(),
        candidate_type: 'menu',
        candidates,
      });

      navigate(`/rooms/${result.room_id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('방 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Header */}
        <div className="py-2.5 px-4 flex items-center border-b border-gray-50 bg-white z-10">
          <button 
            onClick={onHome}
            className="p-1.5 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Home className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2">
            <Utensils className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2 animate-pulse">최적의 메뉴를 찾고 있어요</h2>
        <p className="text-gray-500 text-sm font-medium">당신의 취향을 분석중...</p>
        </div>
      </div>
    );
  }

  // 1. 정보가 0개일 때의 처리
  if (results.length === 0) {
    return (
      <div className="w-full h-full flex flex-col bg-white">
        {/* Header */}
        <div className="py-2.5 px-4 flex items-center border-b border-gray-50 bg-white z-10">
          <button 
            onClick={onHome}
            className="p-1.5 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Home className="w-5 h-5 text-gray-700" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <SearchX className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">결과가 없어요</h2>
          <p className="text-gray-500 leading-relaxed mb-8 text-sm font-medium">
            선택하신 조건에 맞는 메뉴를 찾지 못했습니다.<br />
            조건을 조금 더 넓게 설정해볼까요?
          </p>
          <Button variant="outline" onClick={onRetry} className="border-orange-200 text-orange-600 hover:bg-orange-50 px-8 font-bold">
            조건 변경하기
          </Button>
        </div>
        
        {/* Footer for empty state */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/90 to-transparent pt-12 z-20">
          <Button variant="secondary" fullWidth size="lg" onClick={onRetry} className="font-bold shadow-lg border-gray-200">
            <RotateCcw className="w-4 h-4 mr-2" />
            처음부터 다시하기
          </Button>
        </div>
      </div>
    );
  }

  const getTempIcon = (temp?: string) => {
    if (temp === 'hot') return <ThermometerSun className="w-3 h-3 text-red-500" />;
    if (temp === 'cold') return <ThermometerSnowflake className="w-3 h-3 text-blue-500" />;
    return <span className="text-[10px]">😌</span>;
  };

  const getHeavinessIcon = (heaviness?: number) => {
    if (heaviness === 1) return <Leaf className="w-3 h-3 text-green-500" />;
    if (heaviness === 3) return <Weight className="w-3 h-3 text-gray-700" />;
    return <span className="text-[10px]">⚖️</span>;
  };

  return (
    <div className="w-full h-full flex flex-col bg-white relative">
      {/* Navigation Header */}
      <div className="py-2.5 px-4 flex items-center border-b border-gray-50 bg-white z-10">
        <button 
          onClick={onHome}
          className="p-1.5 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Home className="w-5 h-5 text-gray-700" />
        </button>
      </div>
      
      {/* Title Header */}
      <div className="text-center mb-1 pt-3 px-6">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          오늘의 추천! <span className="text-orange-500">✨</span>
        </h2>
        <p className="text-sm text-gray-500 mt-0.5 font-medium">
          취향저격 메뉴를 찾아왔어요
        </p>
      </div>
      
      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 pt-2">
        <div className="grid grid-cols-2 gap-2.5 pb-4">
          {results.map((menu, idx) => {
            const isSelected = selectedMenus.has(menu.id);
            
            return (
            <div 
              key={menu.id} 
              onClick={selectMode ? () => toggleMenuSelection(menu.id) : undefined}
              className={`
                flex flex-col relative overflow-hidden
                rounded-2xl transition-all duration-200
                ${selectMode && isSelected
                  ? 'bg-purple-50 border-2 border-purple-500 shadow-lg shadow-purple-100 ring-2 ring-purple-100 ring-offset-2'
                  : idx === 0 && !selectMode
                    ? 'bg-orange-50/50 border-2 border-orange-500 shadow-lg shadow-orange-100 ring-2 ring-orange-100 ring-offset-2' 
                    : 'bg-white border-2 border-gray-100 shadow-sm hover:border-orange-200'
                }
                ${selectMode ? 'cursor-pointer' : ''}
                aspect-[3/4] p-3 justify-between group
              `}
            >
              {/* 선택 모드 체크박스 */}
              {selectMode && (
                <div 
                  className={`
                    absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-20
                    ${isSelected 
                      ? 'bg-purple-500 border-purple-500' 
                      : 'bg-white border-gray-300'
                    }
                  `}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
              )}

              {/* Top Tags */}
              <div className="flex justify-between items-start z-10 w-full mb-1">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                  idx === 0 && !selectMode ? 'bg-white text-orange-600 border-orange-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                }`}>
                  {CATEGORY_MAP[menu.category] || menu.category}
                </span>
                {idx === 0 && !selectMode && (
                  <span className="text-[10px] font-bold text-white bg-orange-500 px-2 py-1 rounded-full shadow-sm animate-pulse">
                    BEST
                  </span>
                )}
              </div>
              
              {/* Menu Content */}
              <div className="text-center z-10 flex-1 flex flex-col justify-center items-center py-2">
                <div className="text-5xl mb-3 filter drop-shadow-sm transition-transform duration-300 group-hover:scale-110">🍽️</div>
                <h3 className={`font-black leading-tight break-keep ${
                  menu.name.length > 6 ? 'text-base' : 'text-lg'
                } text-gray-900 mb-1`}>
                  {menu.name}
                </h3>
                <p className="text-[10px] text-gray-400 line-clamp-1">{menu.description || '설명 없음'}</p>
              </div>

              {/* Attributes & Action */}
              <div className="flex flex-col gap-2.5 z-10 w-full">
                {/* Attribute Badges */}
                <div className="flex justify-center gap-1 h-5">
                  {/* Spiciness */}
                  {menu.spiciness !== undefined && menu.spiciness > 0 && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 border border-red-100 rounded text-[10px] font-bold text-red-600">
                      <Flame className="w-3 h-3 fill-red-500" />
                      <span>{menu.spiciness}</span>
                    </div>
                  )}
                  {/* Temperature */}
                  {menu.temperature && menu.temperature !== 'neutral' && (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-bold ${
                      menu.temperature === 'hot' 
                        ? 'bg-orange-50 border-orange-100 text-orange-600' 
                        : 'bg-blue-50 border-blue-100 text-blue-600'
                    }`}>
                      {getTempIcon(menu.temperature)}
                    </div>
                  )}
                  {/* Heaviness */}
                  {menu.heaviness && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-gray-600">
                      {getHeavinessIcon(menu.heaviness)}
                    </div>
                  )}
                </div>
                
                <Button 
                  size="sm"
                  variant={idx === 0 && !selectMode ? 'primary' : 'outline'} 
                  className={`w-full text-xs h-9 rounded-xl font-bold ${
                    idx === 0 && !selectMode ? 'shadow-md shadow-orange-200' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                  } ${selectMode ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!selectMode) onFindRestaurant(menu.id);
                  }}
                  disabled={selectMode}
                >
                  <MapPin className={`w-3 h-3 mr-1.5 ${idx === 0 && !selectMode ? 'text-white' : 'text-orange-500'}`} />
                  식당 찾기
                </Button>
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Floating Footer Buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent pt-10 z-20">
        {selectMode ? (
          // 선택 모드 버튼들
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">
                  {selectedMenus.size}개 선택됨
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-purple-500 hover:text-purple-700"
                >
                  {selectedMenus.size === results.length || selectedMenus.size === 10 ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <button
                onClick={handleCancelSelectMode}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                취소
              </button>
            </div>
            <Button 
              variant="primary" 
              fullWidth 
              size="lg" 
              onClick={handleOpenCreateRoom}
              disabled={selectedMenus.size < 2}
              className="bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-200"
            >
              <Users className="w-4 h-4 mr-2" />
              투표 방 만들기 ({selectedMenus.size}/10)
            </Button>
          </div>
        ) : (
          // 일반 모드 버튼들
          <div className="space-y-2">
            <Button 
              variant="primary" 
              fullWidth 
              size="lg" 
              onClick={handleStartSelectMode}
              className="bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-200"
            >
              <Users className="w-4 h-4 mr-2" />
              친구들과 투표하기
            </Button>
            <Button 
              variant="secondary" 
              fullWidth 
              size="lg" 
              onClick={onRetry}
              className="bg-white/90 backdrop-blur border border-gray-200 text-gray-600 font-bold shadow-lg hover:bg-gray-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              다시하기
            </Button>
          </div>
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
                  placeholder="예: 점심 뭐먹지?"
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
                선택한 메뉴: {results.filter(m => selectedMenus.has(m.id)).map(m => m.name).join(', ')}
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