import React from 'react';
import { Star, MapPin, ChevronRight } from 'lucide-react';
import type { Restaurant } from '../../../types/restaurant';

interface RestaurantListProps {
  restaurants: Restaurant[];
  onSelect: (restaurant: Restaurant) => void;
}

export const RestaurantList: React.FC<RestaurantListProps> = ({ restaurants, onSelect }) => {
  return (
    <div className="space-y-4">
      {restaurants.map((rest) => (
        <button
          key={rest.id}
          onClick={() => onSelect(rest)}
          className="w-full bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-orange-200 transition-all flex gap-5 text-left active:scale-[0.98]"
        >
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
              
              <div className="ml-auto">
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};