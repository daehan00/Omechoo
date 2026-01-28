import type { VoteResult, Candidate } from '../types';

interface ResultChartProps {
  results: VoteResult[];
  winner: Candidate | null;
}

export const ResultChart: React.FC<ResultChartProps> = ({ results, winner }) => {
  const totalVotes = results.reduce((sum, r) => sum + r.vote_count, 0);
  const sortedResults = [...results].sort((a, b) => b.vote_count - a.vote_count);

  return (
    <div className="space-y-6">
      {/* 우승자 표시 */}
      {winner && (
        <div className="text-center py-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border-2 border-orange-200">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-sm text-gray-600 mb-1">오늘의 메뉴는</p>
          <h2 className="text-2xl font-bold text-orange-600">
            {winner.display_name || winner.value}
          </h2>
        </div>
      )}

      {/* 동점인 경우 */}
      {!winner && totalVotes > 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-2xl border-2 border-gray-200">
          <div className="text-4xl mb-2">🤝</div>
          <p className="text-lg font-medium text-gray-700">동점입니다!</p>
          <p className="text-sm text-gray-500">다시 투표해보세요</p>
        </div>
      )}

      {/* 결과 차트 */}
      <div className="space-y-3">
        {sortedResults.map((result, index) => {
          const percentage = totalVotes > 0 
            ? Math.round((result.vote_count / totalVotes) * 100) 
            : 0;
          const isWinner = winner?.id === result.candidate.id;
          const displayName = result.candidate.display_name || result.candidate.value;

          return (
            <div
              key={result.candidate.id}
              className={`
                relative p-4 rounded-xl overflow-hidden
                ${isWinner ? 'bg-orange-50 border-2 border-orange-300' : 'bg-gray-50 border border-gray-200'}
              `}
            >
              {/* 배경 바 */}
              <div
                className={`
                  absolute left-0 top-0 h-full transition-all duration-700
                  ${isWinner ? 'bg-orange-200/50' : 'bg-gray-200/50'}
                `}
                style={{ width: `${percentage}%` }}
              />

              {/* 콘텐츠 */}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 순위 */}
                  <span
                    className={`
                      w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                      ${index === 0 ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-700'}
                    `}
                  >
                    {index + 1}
                  </span>

                  {/* 메뉴명 */}
                  <div>
                    <p className={`font-semibold ${isWinner ? 'text-orange-700' : 'text-gray-800'}`}>
                      {displayName}
                    </p>
                    {/* 투표자 목록 */}
                    {result.voters.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {result.voters.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* 득표수 */}
                <div className="text-right">
                  <p className={`font-bold ${isWinner ? 'text-orange-600' : 'text-gray-700'}`}>
                    {result.vote_count}표
                  </p>
                  <p className="text-sm text-gray-500">{percentage}%</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 총 투표수 */}
      <p className="text-center text-sm text-gray-500">
        총 {totalVotes}명 투표
      </p>
    </div>
  );
};
