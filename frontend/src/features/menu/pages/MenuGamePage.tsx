import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { menuApi } from '../../../api/menu';
import type { Menu } from '../../../types/menu';
import { MenuResult } from '../components/MenuResult';

// Types for Game State
type GameState = 'IDLE' | 'ANIMATING' | 'READY' | 'REVEALED';

const MenuGamePage: React.FC = () => {
  const navigate = useNavigate();
  
  // State
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [selectedMenus, setSelectedMenus] = useState<Menu[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleLeverPull = async () => {
    if (gameState !== 'IDLE' && gameState !== 'REVEALED') return;

    // Reset for new game
    setGameState('ANIMATING');
    setSelectedMenus([]);
    setError(null);

    try {
      // 1. Determine random count (1~4)
      const randomLimit = Math.floor(Math.random() * 4) + 1;
      
      // 2. Start Animation Timer (3s) & API Call simultaneously
      const animationPromise = new Promise(resolve => setTimeout(resolve, 3000));
      const apiPromise = menuApi.recommendBasic({
        limit: randomLimit,
        // No specific filters for true randomness
      });

      const [_, response] = await Promise.all([animationPromise, apiPromise]);

      if (response.data && response.data.length > 0) {
        setSelectedMenus(response.data);
        setGameState('READY');
      } else {
        throw new Error('No menus found');
      }
    } catch (err) {
      console.error(err);
      setError('메뉴를 불러오는 중 문제가 발생했습니다. 다시 시도해주세요.');
      setGameState('IDLE');
    }
  };

  const handleCapsuleClick = () => {
    setGameState('REVEALED');
  };

  const handleRetry = () => {
    setGameState('IDLE');
    setSelectedMenus([]);
  };

  // --- Visual Components ---

  const GachaMachine = () => (
    <div className="relative flex flex-col items-center">
      {/* Top Dome */}
      <div className={`
        w-64 h-64 bg-blue-100/30 rounded-full border-4 border-blue-200 
        relative overflow-hidden mb-[-40px] z-10 backdrop-blur-sm
        ${gameState === 'ANIMATING' ? 'animate-pulse' : ''}
      `}>
        {/* Decorative Balls inside */}
        <div className={`absolute top-10 left-10 w-12 h-12 rounded-full bg-red-400 opacity-80 ${gameState === 'ANIMATING' ? 'animate-bounce' : ''}`} style={{ animationDuration: '0.5s' }} />
        <div className={`absolute top-20 right-12 w-10 h-10 rounded-full bg-yellow-400 opacity-80 ${gameState === 'ANIMATING' ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.1s', animationDuration: '0.6s' }} />
        <div className={`absolute bottom-16 left-20 w-14 h-14 rounded-full bg-green-400 opacity-80 ${gameState === 'ANIMATING' ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.2s', animationDuration: '0.4s' }} />
        <div className={`absolute top-8 right-24 w-8 h-8 rounded-full bg-purple-400 opacity-80 ${gameState === 'ANIMATING' ? 'animate-bounce' : ''}`} style={{ animationDelay: '0.15s', animationDuration: '0.5s' }} />
        
        {/* Reflection */}
        <div className="absolute top-4 left-6 w-16 h-8 bg-white/40 rounded-full transform -rotate-12 blur-sm" />
      </div>

      {/* Main Body */}
      <div className="w-60 h-64 bg-orange-500 rounded-b-3xl rounded-t-[40px] relative shadow-xl flex flex-col items-center pt-16">
        {/* Label */}
        <div className="bg-yellow-400 px-6 py-2 rounded-full border-2 border-orange-600 shadow-sm transform -translate-y-4">
          <span className="font-black text-orange-900 tracking-wider text-lg">MENU</span>
        </div>

        {/* Chute/Exit */}
        <div className="mt-auto mb-8 w-32 h-24 bg-gray-800 rounded-2xl border-b-4 border-gray-700 relative overflow-visible flex justify-center items-end p-2 shadow-inner">
           {/* Capsule when READY */}
           {gameState === 'READY' && (
             <button 
               onClick={handleCapsuleClick}
               className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-bounce z-20 cursor-pointer hover:scale-105 transition-transform"
             >
               <div className="w-full h-1 bg-black/10 absolute top-1/2 -translate-y-1/2" />
               <div className="w-8 h-8 bg-white rounded-full border-4 border-gray-200" />
               <span className="absolute -top-8 bg-white px-2 py-1 rounded text-xs font-bold text-red-500 animate-pulse whitespace-nowrap">
                 Touch!
               </span>
             </button>
           )}
        </div>
      </div>

      {/* Lever (Right Side) */}
      <div className="absolute right-[50%] translate-x-[140px] top-[280px]">
        <div className="relative">
          {/* Base */}
          <div className="w-4 h-16 bg-gray-300 rounded-r-lg border-l border-gray-400" />
          {/* Handle Stick + Ball */}
          <button 
            onClick={handleLeverPull}
            disabled={gameState === 'ANIMATING'}
            className={`
              absolute top-2 left-2 w-24 h-4 bg-gray-400 rounded-full origin-left transition-transform duration-500 ease-in-out cursor-pointer
              ${gameState === 'ANIMATING' ? 'rotate-[45deg]' : '-rotate-[45deg] hover:-rotate-[40deg]'}
            `}
          >
             <div className={`
               absolute -right-3 -top-3 w-10 h-10 bg-red-500 rounded-full border-b-4 border-red-700 shadow-lg
               ${gameState === 'IDLE' ? 'animate-bounce shadow-[0_0_15px_rgba(239,68,68,0.6)]' : ''}
             `} />
          </button>
          
          {/* Guide Tooltip */}
          {gameState === 'IDLE' && (
            <div className="absolute left-16 top-0 animate-pulse whitespace-nowrap">
              <span className="text-sm font-bold text-orange-600 bg-white px-2 py-1 rounded-lg border border-orange-200 shadow-sm relative">
                Click!
                <div className="absolute top-1/2 -left-1 w-2 h-2 bg-white border-l border-b border-orange-200 transform -translate-y-1/2 rotate-45"></div>
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Platform Shadow */}
      <div className="w-64 h-8 bg-black/10 rounded-[100%] absolute bottom-[-10px] blur-sm z-[-1]" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-orange-50 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center p-4 z-10 absolute top-0 w-full">
         <button 
          onClick={() => navigate('/menu/mode')}
          className="p-2 bg-white/80 backdrop-blur rounded-full shadow-sm hover:bg-white transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 text-6xl opacity-10 rotate-12">🍔</div>
          <div className="absolute bottom-40 right-10 text-6xl opacity-10 -rotate-12">🍕</div>
          <div className="absolute top-1/2 left-4 text-4xl opacity-10 rotate-45">🍣</div>
        </div>

        {gameState === 'REVEALED' && selectedMenus.length > 0 ? (
          // Result View
          <div className="w-full h-full absolute top-0 left-0 z-50 bg-white animate-in fade-in slide-in-from-bottom-10 duration-500">
             <MenuResult 
               results={selectedMenus}
               loading={false}
               onRetry={handleRetry}
               onFindRestaurant={(id) => navigate(`/restaurant/search?menuId=${id}`)}
             />
          </div>
        ) : (
          // Game View
          <div className="flex flex-col items-center z-10 mt-10">
             <div className="mb-8 text-center">
               <h1 className="text-3xl font-black text-gray-800 mb-2">
                 {gameState === 'IDLE' && "운명의 메뉴 뽑기"}
                 {gameState === 'ANIMATING' && "두구두구두구..."}
                 {gameState === 'READY' && "캡슐 도착!"}
               </h1>
               <p className="text-gray-500 font-medium">
                 {gameState === 'IDLE' && "오늘 뭐 먹을지 고민될 땐 레버를 당겨보세요!"}
                 {gameState === 'ANIMATING' && "과연 어떤 메뉴가 나올까요?"}
                 {gameState === 'READY' && "캡슐을 눌러서 열어보세요!"}
               </p>
             </div>

             <GachaMachine />

             {error && (
               <div className="mt-8 p-4 bg-red-50 text-red-500 rounded-lg text-sm font-bold animate-pulse">
                 {error}
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuGamePage;
