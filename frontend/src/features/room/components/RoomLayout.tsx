import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RoomStatus } from '../types';

interface RoomLayoutProps {
  roomName: string;
  status: RoomStatus;
  children: React.ReactNode;
}

const statusConfig: Record<RoomStatus, { label: string; color: string }> = {
  waiting: { label: '대기중', color: 'bg-yellow-100 text-yellow-700' },
  voting: { label: '투표중', color: 'bg-green-100 text-green-700' },
  closed: { label: '종료됨', color: 'bg-gray-100 text-gray-700' },
};

export const RoomLayout: React.FC<RoomLayoutProps> = ({
  roomName,
  status,
  children,
}) => {
  const navigate = useNavigate();
  const { label, color } = statusConfig[status];

  return (
    <div className="min-h-full bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h1 className="font-bold text-gray-900 truncate max-w-[200px]">
            {roomName}
          </h1>

          <span className={`px-2 py-1 text-xs font-bold rounded-full ${color}`}>
            {label}
          </span>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};
