import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, Play } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { menuApi } from '../../../api/menu';
import { MenuResult } from '../components/MenuResult';
import type { Menu, MenuCategory, MainBase, Temperature, Heaviness } from '../../../types/menu';

type WizardStep = 'category' | 'mainBase' | 'details' | 'result';

// --- Data Constants ---
const CATEGORIES: { id: MenuCategory; name: string; icon: string }[] = [
  { id: 'korean', name: '한식', icon: '🍚' },
  { id: 'japanese', name: '일식', icon: '🍣' },
  { id: 'chinese', name: '중식', icon: '🥡' },
  { id: 'western', name: '양식', icon: '🍝' },
  { id: 'asian', name: '아시안', icon: '🍜' },
  { id: 'fast_food', name: '패스트푸드', icon: '🍔' },
  { id: 'fusion', name: '퓨전', icon: '🍱' },
  { id: 'other', name: '기타', icon: '🍛' },
];

const MAIN_BASES: { id: MainBase; name: string; icon: string; desc: string }[] = [
  { id: 'rice', name: '밥', icon: '🍚', desc: '든든한 밥심' },
  { id: 'noodle', name: '면', icon: '🍜', desc: '호로록 면치기' },
  { id: 'meat', name: '고기', icon: '🥩', desc: '단백질 충전' },
  { id: 'bread', name: '빵/밀가루', icon: '🍞', desc: '간편하고 맛있게' },
  { id: 'seafood', name: '해산물', icon: '🦐', desc: '바다의 신선함' },
  { id: 'vegetable', name: '채소/샐러드', icon: '🥗', desc: '가볍고 건강하게' },
  { id: 'etc', name: '기타/분식', icon: '🍡', desc: '떡볶이 등' },
];

const SPICINESS_LEVELS = [
  { value: 0, label: '안매움', color: 'bg-green-100 text-green-700' },
  { value: 1, label: '약간 매움', color: 'bg-yellow-100 text-yellow-700' },
  { value: 2, label: '적당히', color: 'bg-orange-100 text-orange-700' },
  { value: 3, label: '매움', color: 'bg-red-100 text-red-700' },
  { value: 4, label: '아주 매움', color: 'bg-red-200 text-red-800' },
];

const TEMPERATURES: { value: Temperature; label: string; icon: string }[] = [
  { value: 'hot', label: '뜨거운', icon: '🔥' },
  { value: 'neutral', label: '미지근', icon: '😌' },
  { value: 'cold', label: '차가운', icon: '❄️' },
];

const HEAVINESS_LEVELS: { value: Heaviness; label: string; icon: string }[] = [
  { value: 1, label: '가볍게', icon: '🍃' },
  { value: 2, label: '적당히', icon: '⚖️' },
  { value: 3, label: '헤비하게', icon: '🍖' },
];

const RECOMMENDATION_LIMIT = 4;

// --- Component ---

const MenuWizardPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [step, setStep] = useState<WizardStep>('category');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Menu[]>([]);

  // Selection State
  const [selectedCategories, setSelectedCategories] = useState<MenuCategory[]>([]);
  const [mainBase, setMainBase] = useState<MainBase[]>([]);
  const [spiciness, setSpiciness] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<Temperature | null>(null);
  const [heaviness, setHeaviness] = useState<Heaviness | null>(null);

  // Touch State for Swipe
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);

  // Handlers
  const toggleCategory = (id: MenuCategory) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleMainBase = (id: MainBase) => {
    setMainBase(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleRecommend = async () => {
    setLoading(true);
    setStep('result');
    
    // Construct Attributes
    const attributes: Record<string, any> = {};
    if (mainBase.length > 0) attributes.main_base = mainBase;
    if (spiciness !== null) attributes.spiciness = spiciness;
    if (temperature) attributes.temperature = temperature;
    if (heaviness) attributes.heaviness = heaviness;

    try {
      const response = await menuApi.recommendBasic({
        included_categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        limit: RECOMMENDATION_LIMIT,
      });
      
      if (response.success && response.data.length > 0) {
        const bestMenu = response.data[0];
        // 결과 화면을 보여주는 대신 바로 식당 검색으로 이동 (통합)
        navigate(`/restaurant/search?menuId=${bestMenu.id}&menuName=${encodeURIComponent(bestMenu.name)}`, {
          state: { 
            menuName: bestMenu.name,
            recommendations: response.data 
          }
        });
      } else if (response.success) {
        setResults([]);
        setStep('result');
      }
    } catch (error) {
      console.error('Failed to get recommendation', error);
      // In real app, show toast or error message
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('category');
    setResults([]);
    setSelectedCategories([]);
    setMainBase([]);
    setSpiciness(null);
    setTemperature(null);
    setHeaviness(null);
  };

  const nextStep = () => {
    if (step === 'category') setStep('mainBase');
    else if (step === 'mainBase') setStep('details');
    else if (step === 'details') handleRecommend();
  };

  const prevStep = () => {
    if (step === 'category') navigate('/menu/mode');
    else if (step === 'mainBase') setStep('category');
    else if (step === 'details') setStep('mainBase');
    else if (step === 'result') setStep('details');
  };

  // Swipe Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    // Only detect swipe if started from the left edge (40% of screen width)
    const startX = e.targetTouches[0].clientX;
    const screenWidth = window.innerWidth;
    
    if (startX < screenWidth * 0.4) {
      setTouchStart({
        x: startX,
        y: e.targetTouches[0].clientY
      });
    } else {
      setTouchStart(null);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    // Minimum swipe distance in pixels
    const minSwipeDistance = 50; 
    
    // Check if horizontal swipe dominates vertical scroll
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe Right -> Back
        prevStep();
      }
    }
    
    setTouchStart(null);
  };

  // Helper for rendering section headers
  const SectionHeader = ({ title, desc }: { title: string, desc: string }) => (
    <div className="mb-4">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );

  return (
    <div 
      className="flex flex-col h-full bg-white relative"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 1. Header - 결과 화면에서는 MenuResult가 자체 헤더를 가짐 */}
      {step !== 'result' && (
        <div className="py-2.5 px-4 flex items-center justify-between border-b border-gray-50 bg-white z-10">
          <button 
            onClick={prevStep}
            className="p-1.5 -ml-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <div className="flex gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${step === 'category' ? 'bg-orange-500' : 'bg-gray-200'}`} />
            <div className={`w-1.5 h-1.5 rounded-full ${step === 'mainBase' ? 'bg-orange-500' : 'bg-gray-200'}`} />
            <div className={`w-1.5 h-1.5 rounded-full ${step === 'details' ? 'bg-orange-500' : 'bg-gray-200'}`} />
          </div>
          
          {/* Empty div for layout balance */}
          <div className="w-8"></div>
        </div>
      )}

      {/* 2. Scrollable Content */}
      <div className={`flex-1 ${step === 'result' ? 'overflow-hidden p-0' : 'overflow-y-auto p-6 pb-24'}`}>
        {step === 'category' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-gray-900 mb-1.5">어떤 종류가 땡기시나요?</h2>
              <p className="text-sm text-gray-500">선택하지 않으면 모든 종류에서 추천해요.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 active:scale-95 ${
                    selectedCategories.includes(cat.id)
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200 ring-offset-1'
                      : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/30'
                  }`}
                >
                  <span className="text-2xl mb-1.5">{cat.icon}</span>
                  <span className={`text-sm font-bold ${selectedCategories.includes(cat.id) ? 'text-orange-700' : 'text-gray-700'}`}>
                    {cat.name}
                  </span>
                  {selectedCategories.includes(cat.id) && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'mainBase' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-gray-900 mb-1.5">오늘의 주식(Main)은?</h2>
              <p className="text-sm text-gray-500">가장 핵심적인 재료를 골라주세요.</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => setMainBase([])}
                className={`p-3.5 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                  mainBase.length === 0 
                    ? 'border-gray-800 bg-gray-800 text-white' 
                    : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                }`}
              >
                상관없음 (다 좋아!)
              </button>
              
              {MAIN_BASES.map((base) => (
                <button
                  key={base.id}
                  onClick={() => toggleMainBase(base.id)}
                  className={`flex items-center p-3.5 rounded-xl border-2 transition-all duration-200 active:scale-95 text-left ${
                    mainBase.includes(base.id)
                      ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-200'
                      : 'border-gray-100 bg-white hover:border-orange-200'
                  }`}
                >
                  <span className="text-xl mr-3.5">{base.icon}</span>
                  <div className="flex-1">
                    <span className={`block text-sm font-bold ${mainBase.includes(base.id) ? 'text-orange-800' : 'text-gray-800'}`}>
                      {base.name}
                    </span>
                    <span className="text-[11px] text-gray-400 leading-tight">{base.desc}</span>
                  </div>
                  {mainBase.includes(base.id) && <Check className="w-4 h-4 text-orange-500" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-8">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-1.5">마지막 디테일!</h2>
              <p className="text-sm text-gray-500">원하는 느낌만 콕콕 집어주세요.</p>
            </div>

            {/* 1. Spiciness */}
            <div>
              <SectionHeader title="맵기 정도" desc="스트레스 풀 땐 매운맛이죠" />
              <div className="flex flex-wrap gap-2">
                <button
                   onClick={() => setSpiciness(null)}
                   className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                     spiciness === null ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-200'
                   }`}
                >
                  상관없음
                </button>
                {SPICINESS_LEVELS.map((lvl) => (
                  <button
                    key={lvl.value}
                    onClick={() => setSpiciness(lvl.value === spiciness ? null : lvl.value)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${
                      spiciness === lvl.value 
                        ? `${lvl.color} border-transparent ring-2 ring-offset-1 ring-orange-200` 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Temperature */}
            <div>
              <SectionHeader title="국물 / 온도" desc="오늘 날씨엔 뭐가 좋을까요?" />
              <div className="grid grid-cols-3 gap-3">
                 <button
                   onClick={() => setTemperature(null)}
                   className={`col-span-3 py-2 rounded-lg text-sm font-bold border transition-colors ${
                     temperature === null ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-200'
                   }`}
                >
                  상관없음
                </button>
                {TEMPERATURES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTemperature(t.value === temperature ? null : t.value)}
                    className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${
                      temperature === t.value
                        ? 'border-orange-500 bg-orange-50 text-orange-800'
                        : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl mb-1">{t.icon}</span>
                    <span className="text-sm font-bold">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Heaviness */}
            <div>
              <SectionHeader title="헤비함 정도" desc="배가 얼마나 고픈가요?" />
              <div className="grid grid-cols-3 gap-3">
                <button
                   onClick={() => setHeaviness(null)}
                   className={`col-span-3 py-2 rounded-lg text-sm font-bold border transition-colors ${
                     heaviness === null ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-200'
                   }`}
                >
                  상관없음
                </button>
                {HEAVINESS_LEVELS.map((h) => (
                  <button
                    key={h.value}
                    onClick={() => setHeaviness(h.value === heaviness ? null : h.value)}
                    className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${
                      heaviness === h.value
                        ? 'border-orange-500 bg-orange-50 text-orange-800'
                        : 'border-gray-100 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-xl mb-1">{h.icon}</span>
                    <span className="text-sm font-bold">{h.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center h-full">
            <MenuResult 
              results={results}
              loading={loading}
              onRetry={reset}
              onFindRestaurant={(menuId) => navigate(`/restaurant/search?menuId=${menuId}`)}
              onHome={() => navigate('/')}
            />
          </div>
        )}
      </div>

      {/* 3. Floating Bottom Bar (Action Area) */}
      {step !== 'result' && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/90 to-transparent pt-12 z-20">
          <div className="flex gap-3 w-full">
            {/* Secondary Action: Skip or Immediate Recommend */}
            <Button 
              variant="secondary" 
              className="flex-2 border-gray-200 text-gray-500 font-bold bg-white/80 backdrop-blur-sm"
              onClick={handleRecommend}
            >
              <Play className="w-4 h-4 mr-1.5 fill-current" />
              바로 추천
            </Button>

            {/* Primary Action: Next */}
            <Button 
              className="flex-3 shadow-lg shadow-orange-200 font-bold" 
              onClick={nextStep}
            >
              {step === 'details' ? '결과 보기' : '다음 단계'}
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuWizardPage;
