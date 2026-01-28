import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import HomePage from './features/home/pages/HomePage';
import MenuModePage from './features/menu/pages/MenuModePage';
import MenuWizardPage from './features/menu/pages/MenuWizardPage';
import MenuGamePage from './features/menu/pages/MenuGamePage';
import RestaurantSearchPage from './features/restaurant/pages/RestaurantSearchPage';
import CreateRoomPage from './features/room/pages/CreateRoomPage';
import RoomPage from './features/room/pages/RoomPage';

function App() {
  return (
    <Routes>
      {/* 레이아웃이 필요한 페이지 */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu/mode" element={<MenuModePage />} />
        <Route path="/menu/recommend/wizard" element={<MenuWizardPage />} />
        <Route path="/menu/recommend/keyword" element={<div className="p-8 text-center">Keyword 모드 준비중...</div>} />
        <Route path="/menu/recommend/random" element={<MenuGamePage />} />
        <Route path="/restaurant/search" element={<RestaurantSearchPage />} />
      </Route>

      {/* 투표방 (자체 레이아웃 사용) */}
      <Route path="/rooms/create" element={<CreateRoomPage />} />
      <Route path="/rooms/:roomId" element={<RoomPage />} />
    </Routes>
  );
}

export default App;
