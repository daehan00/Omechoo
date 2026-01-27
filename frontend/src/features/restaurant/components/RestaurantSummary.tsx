import React from 'react';
import { MapPin, ChevronRight, X } from 'lucide-react';
import type { Restaurant } from '../../../types/restaurant';
import { Button } from '../../../components/ui/Button';

interface RestaurantSummaryProps {
  restaurant: Restaurant;
  onClose: () => void;
  onViewDetail: (restaurant: Restaurant) => void;
}

export const RestaurantSummary: React.FC<RestaurantSummaryProps> = ({ 
  restaurant, 
  onClose, 
  onViewDetail 
}) => {
  return (
    <div className="absolute bottom-6 left-6 right-6 z-30 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="p-4 flex gap-4">
          <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl shrink-0">
             {restaurant.category.includes('한식') ? '🍚' : '🍽️'}
          </div>
          
          <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-gray-900 truncate">{restaurant.name}</h3>
                <p className="text-xs text-gray-500">{restaurant.category}</p>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 mt-2">
              {/* <div className="flex items-center text-orange-500 font-bold text-sm">
                <Star className="w-3.5 h-3.5 fill-orange-500 mr-1" />
                <span>4.5</span>
              </div>
              <div className="w-px h-3 bg-gray-200" /> */}
              <div className="flex items-center text-gray-500 text-sm">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>{restaurant.distance ? `${(restaurant.distance / 1000).toFixed(1)}km` : ''}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-4 pb-4 flex gap-2">
           <Button 
             variant="primary" 
             fullWidth 
             size="sm" 
             className="rounded-xl font-bold"
             onClick={() => onViewDetail(restaurant)}
           >
             상세 정보 보기
             <ChevronRight className="w-4 h-4 ml-1" />
           </Button>
           <Button 
             variant="secondary" 
             size="sm" 
             className="rounded-xl font-bold bg-gray-50 border-gray-100 text-gray-600"
           >
             길찾기
           </Button>
        </div>
      </div>
    </div>
  );
};