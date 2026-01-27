import { Utensils, MapPin, Search } from 'lucide-react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Button } from './components/ui/Button';
import MenuModePage from './features/menu/pages/MenuModePage';
import MenuWizardPage from './features/menu/pages/MenuWizardPage';
import MenuGamePage from './features/menu/pages/MenuGamePage';
import RestaurantSearchPage from './features/restaurant/pages/RestaurantSearchPage';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full p-8 justify-center min-h-[80vh]">
      <div className="flex justify-center mb-8 mt-auto">
        <div className="bg-orange-100 p-6 rounded-full animate-bounce-slow">
          <Utensils className="w-16 h-16 text-orange-500" />
        </div>
      </div>
      
      <h1 className="text-4xl font-extrabold text-gray-900 mb-3 text-center tracking-tight">
        오메추
      </h1>
      <p className="text-gray-500 text-center mb-12 text-lg">
        오늘 뭐 먹지?<br/>고민을 해결해드려요.
      </p>

      <div className="space-y-4 w-full">
        <Button 
          variant="primary" 
          fullWidth 
          size="lg" 
          className="shadow-orange-200 shadow-lg"
          onClick={() => navigate('/menu/mode')}
        >
          <Search className="w-5 h-5 mr-2" />
          메뉴 추천받기
        </Button>
        
        {/* <Button variant="secondary" fullWidth size="lg">
          <MapPin className="w-5 h-5 mr-2 text-green-600" />
          근처 식당 찾기
        </Button> */}
      </div>

      <div className="mt-auto pt-8 text-center">
        <p className="text-xs text-gray-300 font-light">
          Designed by daehan00
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu/mode" element={<MenuModePage />} />
        <Route path="/menu/recommend/wizard" element={<MenuWizardPage />} />
        <Route path="/menu/recommend/keyword" element={<div className="p-8 text-center">Keyword 모드 준비중...</div>} />
        <Route path="/menu/recommend/random" element={<MenuGamePage />} />
        <Route path="/restaurant/search" element={<RestaurantSearchPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
