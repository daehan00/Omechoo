import { useState } from 'react';
import type { Candidate } from '../types';

interface CandidateCardProps {
  candidate: Candidate;
  voteCount?: number;
  isSelected?: boolean;
  showVotes?: boolean;
  totalVotes?: number;
  onClick?: () => void;
  disabled?: boolean;
  /** 투표 취소 힌트 표시 (선택된 상태에서) */
  showCancelHint?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  voteCount = 0,
  isSelected = false,
  showVotes = false,
  totalVotes = 0,
  onClick,
  disabled = false,
  showCancelHint = false,
}) => {
  // value가 http:// 또는 https://로 시작하면 URL로 판정
  const isUrl = candidate.value.startsWith('http://') || candidate.value.startsWith('https://');
  
  // 기본적으로 미리보기 접힌 상태
  const [showPreview, setShowPreview] = useState(false);
  
  const displayName = candidate.display_name || candidate.value;
  const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
  const url = isUrl ? candidate.value : null;

  const handleUrlClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const togglePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPreview(!showPreview);
  };

  // 카카오맵 URL에서 장소 ID 추출
  const getKakaoPlaceId = (urlStr: string): string | null => {
    const match = urlStr.match(/place\.map\.kakao\.com\/(\d+)/);
    return match ? match[1] : null;
  };

  const kakaoPlaceId = url ? getKakaoPlaceId(url) : null;

  return (
    <div className="relative">
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
                w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
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
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{displayName}</p>
              </div>
              {/* URL이 아닌 경우에만 value 표시 */}
              {candidate.display_name && !isUrl && (
                <p className="text-sm text-gray-500">{candidate.value}</p>
              )}
              {/* 투표 취소 힌트 */}
              {isSelected && showCancelHint && !disabled && (
                <p className="text-xs text-orange-400 mt-1">다시 탭하여 취소</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* URL 버튼들 */}
            {isUrl && (
              <div className="flex gap-1">
                {/* 미리보기 토글 - 텍스트 버튼 */}
                <button
                  onClick={togglePreview}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                    showPreview 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-500'
                  }`}
                  title="미리보기"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {showPreview ? '접기' : '미리보기'}
                </button>
                {/* 새 탭에서 열기 */}
                <button
                  onClick={handleUrlClick}
                  className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-500 rounded-lg transition-colors flex items-center gap-1"
                  title="카카오맵에서 보기"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            )}

            {/* 투표 수 표시 */}
            {showVotes && (
              <div className="text-right ml-2">
                <p className="font-bold text-orange-500">{voteCount}표</p>
                <p className="text-sm text-gray-500">{percentage}%</p>
              </div>
            )}
          </div>
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

      {/* URL 미리보기 영역 */}
      {isUrl && showPreview && (
        <div 
          className="mt-2 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {kakaoPlaceId ? (
            // 카카오맵 iframe 미리보기
            <div className="relative">
              <iframe
                src={`https://place.map.kakao.com/m/${kakaoPlaceId}`}
                className="w-full h-100 border-0"
                title={`${displayName} 미리보기`}
                loading="lazy"
              />
              {/* <button
                onClick={handleUrlClick}
                className="absolute bottom-3 right-3 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                카카오맵에서 보기
              </button> */}
            </div>
          ) : (
            // 일반 URL 링크 카드
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{displayName}</p>
                  <p className="text-sm text-gray-500 truncate max-w-[200px]">{url}</p>
                </div>
              </div>
              <button
                onClick={handleUrlClick}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                열기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
