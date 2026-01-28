import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, MapPin, Search, User, Sparkles, Users } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* 1. Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-8 pb-0">
        <div className="bg-orange-100 p-6 rounded-full animate-bounce-slow mb-6">
          <Utensils className="w-14 h-14 text-orange-500" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 text-center tracking-tight leading-tight">
          오늘 뭐 먹지?<br />
          <span className="text-orange-500">오메추</span>가 답이다!
        </h1>
        <p className="text-gray-500 text-center mb-10 text-lg leading-relaxed">
          고민은 짧게, 즐거움은 길게.<br />
          지금 바로 당신의 메뉴를 찾아보세요.
        </p>

        <div className="w-full space-y-3 mb-8">
          <Button 
            variant="primary" 
            fullWidth 
            size="lg" 
            className="shadow-xl shadow-orange-200 text-lg h-14 rounded-2xl"
            onClick={() => navigate('/menu/mode')}
          >
            <Search className="w-5 h-5 mr-2" />
            메뉴 추천받기
          </Button>
          
          <Button 
            variant="secondary" 
            fullWidth 
            size="lg"
            className="text-lg h-14 rounded-2xl bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100"
            onClick={() => navigate('/restaurant/search')}
          >
            <MapPin className="w-5 h-5 mr-2 text-green-600" />
            주변 식당 찾기
          </Button>

          <Button 
            variant="secondary" 
            fullWidth 
            size="lg"
            className="text-lg h-14 rounded-2xl bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100"
            onClick={() => navigate('/rooms/create')}
          >
            <Users className="w-5 h-5 mr-2" />
            같이 고르기
          </Button>
        </div>
      </div>

      {/* 2. Feature Introduction Section */}
      <div className="px-6 py-10 bg-gray-50 rounded-t-[40px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <h2 className="text-xl font-black text-gray-900 mb-6 text-center">
          오메추가 특별한 이유 ✨
        </h2>

        <div className="space-y-5">
          {/* Feature 2: Fun & One-Stop (Core) */}
          <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-md flex gap-4 items-start relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-orange-100/50 rounded-bl-full -mr-4 -mt-4" />
            <div className="bg-orange-50 p-3 rounded-xl shrink-0 z-10">
              <Sparkles className="w-6 h-6 text-orange-500" />
            </div>
            <div className="z-10">
              <h3 className="font-bold text-gray-900 text-lg mb-1">식당 추천까지 한 번에</h3>
              <p className="text-sm text-gray-500 leading-snug">
                마음에 드는 메뉴를 추천받고, 바로 주변 맛집 검색과 길찾기까지 연결해드려요.
              </p>
            </div>
          </div>

          {/* Feature 1: Personalized (Future) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-start">
            <div className="bg-blue-50 p-3 rounded-xl shrink-0">
              <User className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">나보다 나를 더 잘 아는 추천</h3>
              <p className="text-sm text-gray-500 leading-snug">
                로그인하면 취향을 분석해서 딱 맞는 메뉴를 제안해드려요.
                <span className="inline-block bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded ml-2 font-bold align-middle">준비중</span>
              </p>
            </div>
          </div>

          {/* Feature 3: Group Voting */}
          <div 
            className="bg-white p-5 rounded-2xl border border-purple-100 shadow-md flex gap-4 items-start cursor-pointer hover:shadow-lg transition-shadow"
            // onClick={() => navigate('/rooms/create')}
          >
            <div className="bg-purple-50 p-3 rounded-xl shrink-0">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">같이 고르기</h3>
              <p className="text-sm text-gray-500 leading-snug">
                링크 하나로 팀원들을 초대해서 다같이 메뉴 투표를 할 수 있어요.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-300 font-light">
            Designed by daehan00
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
