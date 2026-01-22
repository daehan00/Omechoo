from abc import ABC, abstractmethod
from app.domain.entities.menu import Menu
from app.domain.value_objects.recommendation_context import RecommendationContext


class RecommendationStrategy(ABC):
    """메뉴 추천 전략 인터페이스"""
    
    @abstractmethod
    def recommend(
        self,
        context: RecommendationContext,
        limit: int = 5,
    ) -> list[Menu]:
        """메뉴 추천
        
        Args:
            context: 추천 컨텍스트
            limit: 최대 추천 개수
            
        Returns:
            추천된 메뉴 목록
        """
        ...
