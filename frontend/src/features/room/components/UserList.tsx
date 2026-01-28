import type { Participant } from '../types';

interface UserListProps {
  participants: Participant[];
  maxDisplay?: number;
}

export const UserList: React.FC<UserListProps> = ({
  participants,
  maxDisplay = 10,
}) => {
  const displayParticipants = participants.slice(0, maxDisplay);
  const remainingCount = participants.length - maxDisplay;

  // 아바타 색상 팔레트
  const colors = [
    'bg-orange-400',
    'bg-blue-400',
    'bg-green-400',
    'bg-purple-400',
    'bg-pink-400',
    'bg-yellow-400',
    'bg-indigo-400',
    'bg-red-400',
  ];

  const getColor = (index: number) => colors[index % colors.length];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">참여자</span>
        <span className="px-2 py-0.5 text-xs font-bold bg-orange-100 text-orange-600 rounded-full">
          {participants.length}명
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {displayParticipants.map((participant, index) => (
          <div
            key={participant.nickname}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full"
          >
            {/* 아바타 */}
            <div
              className={`w-8 h-8 ${getColor(index)} rounded-full flex items-center justify-center text-white font-bold text-sm`}
            >
              {participant.nickname.charAt(0).toUpperCase()}
            </div>
            
            {/* 닉네임 */}
            <span className="text-sm font-medium text-gray-800">
              {participant.nickname}
            </span>
            
            {/* 방장 뱃지 */}
            {participant.is_host && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-orange-500 text-white rounded">
                방장
              </span>
            )}
          </div>
        ))}

        {/* 더 있는 경우 */}
        {remainingCount > 0 && (
          <div className="flex items-center px-3 py-2 bg-gray-100 rounded-full">
            <span className="text-sm text-gray-600">+{remainingCount}명</span>
          </div>
        )}
      </div>
    </div>
  );
};
