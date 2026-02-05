import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Map as MapIcon, List, Home, Navigation, MapPin, Search, AlertCircle, RotateCw, Map as MapIconGeneric, RotateCcw, Utensils } from 'lucide-react';
import { useGeolocation } from '../../../hooks/useGeolocation';
import { restaurantApi } from '../../../api/restaurant';
import type { Restaurant } from '../../../types/restaurant';
import { KakaoMap } from '../components/KakaoMap';
import { RestaurantList } from '../components/RestaurantList';
import { RestaurantSummary } from '../components/RestaurantSummary';
import { RestaurantMapPreviewModal } from '../components/RestaurantMapPreviewModal';
import { LocationSearchModal } from '../components/LocationSearchModal';
import { Button } from '../../../components/ui/Button';

type ViewMode = 'MAP' | 'LIST';

const RestaurantSearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const menuId = searchParams.get('menuId');
  
  const { latitude: myLat, longitude: myLng, loading: geoLoading, error: geoError, refresh: refreshGeo } = useGeolocation();
  const [manualLocation, setManualLocation] = useState<{lat: number, lng: number} | null>(null);
  const currentLocationName = "주변 맛집 탐색";
  
  const [viewMode, setViewMode] = useState<ViewMode>('MAP');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [mapInstance, setMapInstance] = useState<kakao.maps.Map | null>(null);
  const [showReSearch, setShowReSearch] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [detailRestaurant, setDetailRestaurant] = useState<Restaurant | null>(null);

  // Active Location: Real GPS or Manual Fallback
  const activeLat = myLat ?? manualLocation?.lat;
  const activeLng = myLng ?? manualLocation?.lng;

  // Auto-open search modal on Geo Error
  useEffect(() => {
    if (geoError && !activeLat) {
      setIsSearchModalOpen(true);
    }
  }, [geoError, activeLat]);

  useEffect(() => {
    if (activeLat && activeLng) {
      setMapCenter({ lat: activeLat, lng: activeLng });
      if (menuId) {
        fetchRestaurants(activeLat, activeLng);
      }
    }
  }, [activeLat, activeLng, menuId]);

  const fetchRestaurants = async (lat: number, lng: number) => {
    if (!menuId) {
      console.warn('fetchRestaurants: menuId is missing');
      return;
    }
    
    setSelectedRestaurant(null);

    try {
      setLoading(true);
      setError(null);
      const response = await restaurantApi.search({
        menu_id: menuId,
        latitude: lat,
        longitude: lng,
        radius_km: 1.5,
      });
      setRestaurants(response.data || []);
      setShowReSearch(false);
    } catch (err) {
      console.error(err);
      setError('식당 정보를 가져오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    if (restaurant.location && mapInstance) {
      const moveLatLon = new kakao.maps.LatLng(restaurant.location.latitude, restaurant.location.longitude);
      mapInstance.panTo(moveLatLon);
    }
  };

  const handleViewDetail = (restaurant: Restaurant) => {
    setDetailRestaurant(restaurant);
  };

  const handlePanToCurrentLocation = () => {
    if (activeLat && activeLng) {
      const moveLatLon = new kakao.maps.LatLng(activeLat, activeLng);
      if (mapInstance) {
        mapInstance.panTo(moveLatLon);
      }
      setMapCenter({ lat: activeLat, lng: activeLng });
    } else {
      refreshGeo();
    }
  };

  const handleManualLocation = () => {
    // Default to Seoul City Hall if GPS fails
    setManualLocation({ lat: 37.5665, lng: 126.9780 });
  };

  const handleMapLoad = (map: kakao.maps.Map) => {
    setMapInstance(map);
  };

  const handleMapDragEnd = () => {
    setShowReSearch(true);
  };

  const handleReSearch = () => {
    if (mapInstance) {
      const center = mapInstance.getCenter();
      const lat = center.getLat();
      const lng = center.getLng();
      fetchRestaurants(lat, lng);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setManualLocation({ lat, lng });
    setMapCenter({ lat, lng });
    
    if (mapInstance) {
      mapInstance.panTo(new kakao.maps.LatLng(lat, lng));
    }
    
    fetchRestaurants(lat, lng);
    setIsSearchModalOpen(false);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'MAP' ? 'LIST' : 'MAP');
  };

  // 0. Missing Menu ID Guard
  if (!menuId) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white p-8 text-center">
        <div className="bg-orange-50 p-6 rounded-full mb-6">
          <Utensils className="w-12 h-12 text-orange-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">메뉴 정보가 없어요</h2>
        <p className="text-gray-500 mb-8">
          어떤 메뉴를 드시고 싶으신가요?<br />
          먼저 메뉴를 선택해주세요.
        </p>
        <Button onClick={() => navigate('/menu/mode')} size="lg" className="font-bold shadow-lg">
          메뉴 고르러 가기
        </Button>
      </div>
    );
  }

  // 1. Geolocation Loading
  if (geoLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <div className="relative mb-8">
           <div className="w-16 h-16 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div>
           <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-orange-500" />
        </div>
        <p className="text-gray-900 font-black text-lg">내 위치를 확인하고 있어요</p>
        <p className="text-gray-400 text-sm mt-1">잠시만 기다려주세요</p>
      </div>
    );
  }

  // 2. Geolocation Error (Permission Denied, etc.) AND No Manual Location
  if (geoError && !activeLat) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white p-8 text-center">
        <div className="bg-red-50 p-6 rounded-full mb-6">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">위치 권한이 필요해요</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          내 주변 맛집을 찾으려면<br />
          위치 정보 접근 권한을 허용해주세요.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto items-center">
          <Button onClick={refreshGeo} size="lg" className="font-bold shadow-lg" fullWidth>
            <RotateCw className="w-5 h-5 mr-2" />
            다시 시도하기
          </Button>
          <Button onClick={handleManualLocation} variant="secondary" size="lg" className="font-bold border-gray-200" fullWidth>
            <MapIconGeneric className="w-5 h-5 mr-2 text-gray-500" />
            지도에서 직접 찾기
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          * '다시 시도'가 안 된다면 브라우저 설정에서 권한을 허용하거나, '지도에서 직접 찾기'를 이용해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden relative">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
        <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto pointer-events-auto">
          <button 
            onClick={() => navigate("/")}
            className="p-3 bg-white rounded-2xl shadow-xl hover:bg-gray-50 active:scale-95 transition-all border border-gray-100"
          >
            <Home className="w-6 h-6 text-gray-700" />
          </button>
          
          <div className="flex-1 bg-white/90 backdrop-blur rounded-2xl shadow-xl px-5 py-3 flex items-center justify-between gap-2 border border-orange-100">
             <div className="flex items-center gap-2 min-w-0">
               <span className="text-gray-800 font-bold text-sm truncate">{currentLocationName}</span>
             </div>
             <button 
               onClick={() => setIsSearchModalOpen(true)}
               className="p-1 hover:bg-orange-50 rounded-lg transition-colors"
             >
               <Search className="w-4 h-4 text-orange-500" />
             </button>
          </div>

          <button 
            onClick={toggleViewMode}
            className="bg-orange-500 backdrop-blur rounded-2xl shadow-xl p-3 border border-gray-100 text-gray-700 hover:bg-orange-700 hover:text-orange-600 transition-all active:scale-95"
          >
            {viewMode === 'MAP' ? <List className="w-6 h-6 text-white" /> : <MapIcon className="w-6 h-6 text-white" />}
          </button>
        </div>
      </div>

      {/* Re-Search Button (Floating below header) */}
      {showReSearch && viewMode === 'MAP' && (
        <div className="absolute top-24 left-0 right-0 z-20 flex justify-center animate-in slide-in-from-top-5 fade-in pointer-events-none">
          <button 
            onClick={handleReSearch}
            className="pointer-events-auto bg-white text-orange-600 font-bold px-5 py-2.5 rounded-full shadow-lg border border-orange-100 flex items-center gap-2 hover:bg-orange-50 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            이 지역에서 다시 검색
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'MAP' ? (
           <div className="absolute inset-0">
             <KakaoMap 
               center={mapCenter}
               restaurants={restaurants}
               onMarkerClick={handleMarkerClick}
               selectedId={selectedRestaurant?.id}
               onMapLoad={handleMapLoad}
               onDragEnd={handleMapDragEnd}
             />
             
             {selectedRestaurant && (
               <RestaurantSummary 
                 restaurant={selectedRestaurant}
                 onClose={() => setSelectedRestaurant(null)}
                 onViewDetail={handleViewDetail}
               />
             )}
           </div>
        ) : (
          <div className="w-full h-full bg-white overflow-y-auto pt-24 px-6 pb-6">
             {loading ? (
               <div className="flex flex-col items-center py-24">
                 <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                 <p className="text-gray-500 font-bold">주변 식당을 검색하고 있어요</p>
               </div>
             ) : restaurants.length > 0 ? (
                <RestaurantList 
                  restaurants={restaurants}
                  onSelect={handleViewDetail}
                />
             ) : (
               <div className="flex flex-col items-center py-32 text-center">
                 <div className="bg-gray-50 p-8 rounded-full mb-6 border border-gray-100">
                   <MapPin className="w-16 h-16 text-gray-200" />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 mb-2">검색 결과가 없어요</h3>
                 <p className="text-gray-400 font-medium">다른 지역을 선택하거나<br/>검색 범위를 넓혀보세요.</p>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      {viewMode === 'MAP' && (
        <div className="absolute bottom-10 right-6 z-20 flex flex-col gap-3">
           <button 
             className="bg-white w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center border border-gray-100 hover:bg-gray-50 active:scale-90 transition-all group"
             onClick={handlePanToCurrentLocation}
           >
             <Navigation className={`w-7 h-7 transition-colors ${activeLat === myLat ? 'text-blue-500' : 'text-gray-800'}`} />
           </button>
        </div>
      )}

      {/* Detail Modal */}
      {detailRestaurant && (
        <RestaurantMapPreviewModal 
          restaurant={detailRestaurant}
          onClose={() => setDetailRestaurant(null)}
        />
      )}

      {/* Location Search Modal */}
      {isSearchModalOpen && (
        <LocationSearchModal 
          onClose={() => setIsSearchModalOpen(false)}
          onSelect={handleLocationSelect}
        />
      )}
      
      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[110] bg-red-500 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl animate-bounce">
          {error}
        </div>
      )}
    </div>
  );
};

export default RestaurantSearchPage;