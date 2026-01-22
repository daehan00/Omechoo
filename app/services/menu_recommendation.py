from datetime import datetime
from app.domain.interfaces.recommender import RecommendationStrategy
from app.domain.entities.menu import Menu
from app.domain.value_objects.recommendation_context import RecommendationContext


class MenuRecommendationService:
    """메뉴 추천 유스케이스"""
    
    def __init__(self, strategy: RecommendationStrategy):
        self._strategy = strategy
    
    def recommend(
        self,
        included_categories: list[str] | None = None,
        excluded_categories: list[str] | None = None,
        attributes: dict[str, bool] | None = None,
        limit: int = 5,
    ) -> list[Menu]:
        """메뉴 추천
        
        Args:
            included_categories: 포함할 카테고리 (없으면 전체)
            excluded_categories: 제외할 카테고리
            attributes: 메뉴 속성 필터
            limit: 최대 추천 개수
            
        Returns:
            추천 메뉴 목록
        """
        context = RecommendationContext(
            timestamp=datetime.now(),
            included_categories=included_categories,
            excluded_categories=excluded_categories,
            attributes=attributes if attributes else {},
        )
        
        return self._strategy.recommend(context, limit)

    def get_all_menus(self) -> list[Menu]:
        """모든 메뉴 조회

        Returns:
            모든 메뉴 목록
        """
        return self._strategy.get_all_menus()