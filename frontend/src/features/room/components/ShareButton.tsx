import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

interface ShareButtonProps {
  shareUrl: string;
  roomName?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ shareUrl, roomName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: roomName || '오메추 투표방',
          url: shareUrl,
        });
      } catch (error) {
        // 사용자가 공유 취소한 경우
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex gap-2">
      {/* 링크 복사 버튼 */}
      <button
        onClick={handleCopy}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200
          ${copied
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        {copied ? (
          <>
            <Check className="w-5 h-5" />
            <span>복사됨!</span>
          </>
        ) : (
          <>
            <Copy className="w-5 h-5" />
            <span>링크 복사</span>
          </>
        )}
      </button>

      {/* 공유 버튼 (모바일) */}
      {'share' in navigator && (
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all duration-200"
        >
          <Share2 className="w-5 h-5" />
          <span>공유하기</span>
        </button>
      )}
    </div>
  );
};
