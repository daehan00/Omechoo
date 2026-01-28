import type { Candidate } from '../types';

interface CandidateCardProps {
  candidate: Candidate;
  voteCount?: number;
  isSelected?: boolean;
  showVotes?: boolean;
  totalVotes?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  voteCount = 0,
  isSelected = false,
  showVotes = false,
  totalVotes = 0,
  onClick,
  disabled = false,
}) => {
  const displayName = candidate.display_name || candidate.value;
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-full p-4 rounded-xl border-2 transition-all duration-200
        ${isSelected
          ? 'border-orange-500 bg-orange-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 선택 표시 */}
          <div
            className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center
              ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}
            `}
          >
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          
          {/* 메뉴명 */}
          <div className="text-left">
            <p className="font-semibold text-gray-900">{displayName}</p>
            {candidate.display_name && (
              <p className="text-sm text-gray-500">{candidate.value}</p>
            )}
          </div>
        </div>

        {/* 투표 수 표시 */}
        {showVotes && (
          <div className="text-right">
            <p className="font-bold text-orange-500">{voteCount}표</p>
            <p className="text-sm text-gray-500">{percentage}%</p>
          </div>
        )}
      </div>

      {/* 투표 진행률 바 */}
      {showVotes && totalVotes > 0 && (
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </button>
  );
};
