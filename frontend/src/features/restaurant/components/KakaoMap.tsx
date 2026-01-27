import React from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import { AlertCircle } from 'lucide-react';
import type { Restaurant } from '../../../types/restaurant';

interface KakaoMapProps {
  center: { lat: number; lng: number };
  restaurants: Restaurant[];
  onMarkerClick: (restaurant: Restaurant) => void;
  selectedId?: string | null;
  onMapLoad?: (map: kakao.maps.Map) => void;
  onDragEnd?: (map: kakao.maps.Map) => void;
}

export const KakaoMap: React.FC<KakaoMapProps> = ({
  center,
  restaurants,
  onMarkerClick,
  selectedId,
  onMapLoad,
  onDragEnd
}) => {
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_APP_KEY,
    libraries: ['services', 'clusterer'],
  });

  if (loading) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-3"></div>
        <p className="text-gray-500 font-bold text-sm">지도를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
        <p className="text-gray-800 font-bold">지도를 불러올 수 없습니다</p>
        <p className="text-gray-500 text-xs mt-1">네트워크 상태를 확인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="kakao-map-container w-full h-full">
      <Map
        id="map"
        center={center}
        style={{ width: '100%', height: '100%' }}
        level={4}
        onCreate={(map) => {
          if (onMapLoad) onMapLoad(map);
        }}
        onDragEnd={(map) => {
          if (onDragEnd) onDragEnd(map);
        }}
      >
        {/* Current Position Marker */}
        <MapMarker
          position={center}
        />

        {/* Restaurant Markers */}
        {restaurants.map((rest) => (
          rest.location && (
            <MapMarker
              key={rest.id}
              position={{ lat: rest.location.latitude, lng: rest.location.longitude }}
              onClick={() => onMarkerClick(rest)}
              image={{
                src: selectedId === rest.id 
                  ? 'https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png'
                  : 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
                size: { width: 24, height: 35 },
              }}
            />
          )
        ))}
      </Map>
    </div>
  );
};