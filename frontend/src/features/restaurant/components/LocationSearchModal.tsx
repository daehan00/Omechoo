import React, { useState } from 'react';
import { Search, X, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface LocationSearchModalProps {
  onClose: () => void;
  onSelect: (lat: number, lng: number, name: string) => void;
}

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({ onClose, onSelect }) => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!keyword.trim()) return;

    setSearching(true);
    setError(null);

    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data, status) => {
      setSearching(false);
      if (status === kakao.maps.services.Status.OK) {
        setResults(data);
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        setResults([]);
        setError('검색 결과가 없습니다.');
      } else {
        setError('검색 중 오류가 발생했습니다.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-gray-100">
        <div className="flex-1 relative">
          <input
            autoFocus
            type="text"
            placeholder="지역, 지하철역 등으로 검색"
            className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {searching ? (
          <div className="py-20 flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-3" />
            <p className="text-gray-400 text-sm font-medium">검색 중입니다...</p>
          </div>
        ) : error ? (
          <div className="py-20 px-10 text-center">
            <p className="text-gray-400 font-medium mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={() => setKeyword('')}>지우기</Button>
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {results.map((place) => (
              <button
                key={place.id}
                onClick={() => onSelect(Number(place.y), Number(place.x), place.place_name)}
                className="w-full p-5 flex items-start gap-4 hover:bg-orange-50 transition-colors text-left group"
              >
                <div className="mt-1 bg-gray-50 p-2 rounded-lg group-hover:bg-white transition-colors">
                  <MapPin className="w-4 h-4 text-gray-400 group-hover:text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-gray-900 mb-0.5">{place.place_name}</div>
                  <p className="text-xs text-gray-500 truncate">{place.road_address_name || place.address_name}</p>
                </div>
                <ChevronRight className="mt-2 w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">인기 검색어</h4>
            <div className="flex flex-wrap gap-2">
              {['강남역', '홍대입구', '서울역', '판교', '여의도'].map(k => (
                <button
                  key={k}
                  onClick={() => { setKeyword(k); setTimeout(handleSearch, 0); }}
                  className="bg-gray-50 text-gray-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-50 hover:text-orange-600 transition-all"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};