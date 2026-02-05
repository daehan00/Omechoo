import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { Restaurant } from '../../../types/restaurant';

interface RestaurantMapPreviewModalProps {
  restaurant: Restaurant;
  onClose: () => void;
}

export const RestaurantMapPreviewModal: React.FC<RestaurantMapPreviewModalProps> = ({
  restaurant,
  onClose
}) => {
  const url = restaurant.urls?.[0];

  // 카카오맵 URL에서 장소 ID 추출
  const getKakaoPlaceId = (urlStr: string): string | null => {
    const match = urlStr.match(/place\.map\.kakao\.com\/(\d+)/);
    return match ? match[1] : null;
  };
  const kakaoPlaceId = url ? getKakaoPlaceId(url) : null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-t-[32px] sm:rounded-[32px] h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-20 duration-500 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-lg transition-all active:scale-95 border border-gray-100"
        >
          <X className="w-6 h-6 text-gray-900" />
        </button>

        {/* Content - Full Iframe Preview */}
        <div className="flex-1 w-full h-full relative bg-gray-50">
            {kakaoPlaceId ? (
                <iframe
                    src={`https://place.map.kakao.com/m/${kakaoPlaceId}`}
                    className="w-full h-full border-0"
                    title={`${restaurant.name} 미리보기`}
                    loading="lazy"
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6 text-center">
                    <ExternalLink className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="font-bold text-lg mb-2">미리보기를 제공할 수 없습니다</p>
                    <p className="text-sm text-gray-400 mb-6">
                        {url ? '카카오맵 상세 주소가 아니거나 지원되지 않는 형식입니다.' : '등록된 상세 주소가 없습니다.'}
                    </p>
                    {url && (
                        <div className="flex flex-col gap-3 w-full max-w-xs">
                          <Button
                              variant="primary"
                              fullWidth
                              size="lg"
                              className="rounded-2xl font-black"
                              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                          >
                              새 탭에서 열기
                          </Button>
                          <Button
                              variant="secondary"
                              fullWidth
                              size="lg"
                              className="rounded-2xl font-black bg-white"
                              onClick={onClose}
                          >
                              닫기
                          </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};