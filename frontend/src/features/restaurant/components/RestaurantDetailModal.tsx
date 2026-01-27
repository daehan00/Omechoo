import React, { useState, useEffect } from 'react';
import { X, Star, Clock, MapPin, Phone, MessageSquare } from 'lucide-react';
import { restaurantApi } from '../../../api/restaurant';
import type { Restaurant, RestaurantDetail } from '../../../types/restaurant';
import { Button } from '../../../components/ui/Button';

interface RestaurantDetailModalProps {
  restaurant: Restaurant;
  onClose: () => void;
}

export const RestaurantDetailModal: React.FC<RestaurantDetailModalProps> = ({ 
  restaurant, 
  onClose 
}) => {
  const [detail, setDetail] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      // Use the first URL from the restaurant's urls array
      const placeUrl = restaurant.urls?.[0];
      if (!placeUrl) {
        setError('상세 정보 URL이 없습니다.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await restaurantApi.getDetail({ url: placeUrl });
        setDetail(response.data);
      } catch (err) {
        console.error(err);
        setError('상세 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [restaurant]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-gray-50 flex items-start justify-between">
           <div>
             <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full mb-2 inline-block">
               {restaurant.category}
             </span>
             <h2 className="text-2xl font-black text-gray-900 tracking-tight">{restaurant.name}</h2>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
             <X className="w-6 h-6 text-gray-400" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-gray-400 text-sm font-medium">상세 정보를 가져오는 중...</p>
              <p className="text-[10px] text-gray-300 mt-2">실시간으로 카카오맵 정보를 분석중입니다</p>
            </div>
          ) : error ? (
            <div className="py-20 px-10 text-center">
               <p className="text-red-500 font-bold mb-2">{error}</p>
               <Button variant="outline" size="sm" onClick={onClose}>닫기</Button>
            </div>
          ) : detail ? (
            <div className="p-6 space-y-8">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-orange-50 rounded-2xl p-4 text-center">
                  <Star className="w-5 h-5 text-orange-500 mx-auto mb-1 fill-orange-500" />
                  <div className="text-lg font-black text-gray-900">{detail.rating}</div>
                  <div className="text-[10px] text-gray-500">평점</div>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <MessageSquare className="w-5 h-5 text-blue-500 mx-auto mb-1 fill-blue-500" />
                  <div className="text-lg font-black text-gray-900">{detail.review_count}</div>
                  <div className="text-[10px] text-gray-500">방문자 리뷰</div>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                  <MessageSquare className="w-5 h-5 text-purple-500 mx-auto mb-1 fill-purple-500" />
                  <div className="text-lg font-black text-gray-900">{detail.blog_review_count}</div>
                  <div className="text-[10px] text-gray-500">블로그 리뷰</div>
                </div>
              </div>

              {/* Info List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm mb-1">영업 정보</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {detail.business_status?.[0] + " " + detail.business_status?.[1] || '정보 없음'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm mb-1">전화번호</h4>
                    <p className="text-sm text-gray-600">정보 없음</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm mb-1">위치</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {restaurant.location?.address || '주소 정보 없음'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menus */}
              <div>
                <h4 className="font-black text-gray-900 text-lg mb-4">대표 메뉴</h4>
                <div className="space-y-3">
                  {detail.menus && detail.menus.length > 0 ? (
                    detail.menus.map((menu, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="font-bold text-gray-700">{menu.name}</span>
                        <span className="text-orange-600 font-black text-sm">{menu.price}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic">등록된 메뉴 정보가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex gap-3">
           <Button 
             variant="primary" 
             fullWidth 
             size="lg" 
             className="rounded-2xl font-black shadow-lg"
             onClick={() => {
               const url = restaurant.urls?.[0];
               if (url) window.open(url, '_blank', 'noopener,noreferrer');
             }}
           >
             카카오맵에서 보기
           </Button>
           <Button 
             variant="secondary" 
             size="lg" 
             className="rounded-2xl font-black bg-white"
             onClick={() => {
               if (restaurant.location) {
                 const { latitude, longitude } = restaurant.location;
                 const url = `https://map.kakao.com/link/to/${restaurant.name},${latitude},${longitude}`;
                 window.open(url, '_blank', 'noopener,noreferrer');
               }
             }}
           >
             길찾기
           </Button>
        </div>
      </div>
    </div>
  );
};