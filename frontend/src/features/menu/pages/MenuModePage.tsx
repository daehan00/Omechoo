import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Tag, Dices, ChevronRight, ArrowLeft } from 'lucide-react';

interface ModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

const ModeCard: React.FC<ModeCardProps> = ({ title, description, icon, onClick, color }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center p-5 mb-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-200 transition-all group text-left"
  >
    <div className={`p-4 rounded-xl ${color} mr-5 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div className="flex-1">
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
  </button>
);

const MenuModePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 flex items-center">
        <button 
          onClick={() => navigate('/')}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="ml-2 text-xl font-bold text-gray-900">추천 방식 선택</h1>
      </div>

      <div className="flex-1 p-6 pt-2">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            어떤 방식으로<br />골라볼까요?
          </h2>
          <p className="text-gray-500">취향에 맞는 모드를 선택해주세요.</p>
        </div>

        <div className="flex flex-col">
          <ModeCard
            title="단계별 질문형"
            description="질문에 답하며 꼼꼼하게 골라요"
            icon={<ClipboardList className="w-7 h-7 text-orange-600" />}
            color="bg-orange-50"
            onClick={() => navigate('/menu/recommend/wizard')}
          />
          
          <ModeCard
            title="태그 선택형"
            description="기분 따라 키워드로 빠르게!"
            icon={<Tag className="w-7 h-7 text-blue-600" />}
            color="bg-blue-50"
            onClick={() => navigate('/menu/recommend/keyword')}
          />
          
          <ModeCard
            title="랜덤 게임형"
            description="운에 맡기고 결과만 확인해요"
            icon={<Dices className="w-7 h-7 text-purple-600" />}
            color="bg-purple-50"
            onClick={() => navigate('/menu/recommend/random')}
          />
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
          <p className="text-sm text-gray-400">
            결정이 어려울 땐 <span className="text-orange-500 font-semibold">단계별 질문형</span>을<br />추천드려요!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuModePage;
