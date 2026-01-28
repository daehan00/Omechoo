import React from 'react';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen bg-gray-50 flex justify-center overflow-hidden">
      {/* 
        h-screen (또는 100dvh)을 사용하여 전체 컨테이너 높이를 화면에 맞춤.
        overflow-hidden으로 전체 페이지 스크롤을 막고 내부에서 스크롤하게 함.
      */}
      <div className="w-full max-w-md bg-white h-full shadow-xl relative flex flex-col overflow-hidden">
        {children || <Outlet />}
      </div>
    </div>
  );
};