import React from 'react';
import { RotateCcw, MapPin, Utensils, Flame, ThermometerSun, ThermometerSnowflake, SearchX, Leaf, Weight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { Menu } from '../../../types/menu';

interface MenuResultProps {
  results: Menu[];
  loading: boolean;
  onRetry: () => void;
  onFindRestaurant: (menuId: string) => void;
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
  onFindRestaurant 
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 bg-white">
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2">
            <Utensils className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <h2 className="text-xl font-extrabold text-gray-900 mb-2 animate-pulse">최적의 메뉴를 찾고 있어요</h2>
        <p className="text-gray-500 text-sm font-medium">당신의 취향을 분석중...</p>
      </div>
    );
  }

  // 1. 정보가 0개일 때의 처리
  if (results.length === 0) {
    return (
      <div className="w-full h-full flex flex-col bg-white">
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
      {/* Header */}
      <div className="text-center mb-1 pt-3 px-6">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          오늘의 추천! <span className="text-orange-500">✨</span>
        </h2>
        <p className="text-sm text-gray-500 mt-0.5 font-medium">
          취향저격 메뉴를 찾아왔어요
        </p>
      </div>
      
      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 pt-2">
        <div className="grid grid-cols-2 gap-2.5 pb-4">
          {results.map((menu, idx) => (
            <div 
              key={menu.id} 
              className={`
                flex flex-col relative overflow-hidden
                rounded-2xl transition-all duration-200
                ${idx === 0 
                  ? 'bg-orange-50/50 border-2 border-orange-500 shadow-lg shadow-orange-100 ring-2 ring-orange-100 ring-offset-2' 
                  : 'bg-white border-2 border-gray-100 shadow-sm hover:border-orange-200'
                }
                aspect-[3/4] p-3 justify-between group
              `}
            >
              {/* Top Tags */}
              <div className="flex justify-between items-start z-10 w-full mb-1">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                  idx === 0 ? 'bg-white text-orange-600 border-orange-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                }`}>
                  {CATEGORY_MAP[menu.category] || menu.category}
                </span>
                {idx === 0 && (
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
                  variant={idx === 0 ? 'primary' : 'outline'} 
                  className={`w-full text-xs h-9 rounded-xl font-bold ${
                    idx === 0 ? 'shadow-md shadow-orange-200' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => onFindRestaurant(menu.id)}
                >
                  <MapPin className={`w-3 h-3 mr-1.5 ${idx === 0 ? 'text-white' : 'text-orange-500'}`} />
                  식당 찾기
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Footer Button */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent pt-10 z-20">
        <Button 
          variant="secondary" 
          fullWidth 
          size="lg" 
          onClick={onRetry}
          className="bg-white/90 backdrop-blur border border-gray-200 text-gray-600 font-bold shadow-lg hover:bg-gray-50"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          처음부터 다시하기
        </Button>
      </div>
    </div>
  );
};