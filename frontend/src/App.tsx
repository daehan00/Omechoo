import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import HomePage from './features/home/pages/HomePage';
import MenuModePage from './features/menu/pages/MenuModePage';
import MenuWizardPage from './features/menu/pages/MenuWizardPage';
import MenuGamePage from './features/menu/pages/MenuGamePage';
import RestaurantSearchPage from './features/restaurant/pages/RestaurantSearchPage';

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
