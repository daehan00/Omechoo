import { useState, useEffect } from 'react';

/**
 * 카카오맵 SDK 로드 상태를 관리하는 커스텀 훅
 * index.html에서 autoload=false로 SDK를 로드한 후 사용
 */
export const useKakaoMapLoad = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps && window.kakao.maps.Map) {
      setIsLoaded(true);
      return;
    }

    // kakao 객체가 있지만 maps.load가 필요한 경우
    if (window.kakao && window.kakao.maps) {
      try {
        window.kakao.maps.load(() => {
          setIsLoaded(true);
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('카카오맵 로드 실패'));
      }
      return;
    }

    // SDK 스크립트가 아예 없는 경우
    setError(new Error('카카오맵 SDK가 로드되지 않았습니다. index.html을 확인하세요.'));
  }, []);

  return { isLoaded, error };
};
