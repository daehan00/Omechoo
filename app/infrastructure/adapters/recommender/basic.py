import random
from app.domain.interfaces.recommender import RecommendationStrategy
from app.domain.interfaces.repository import MenuRepository
from app.domain.entities.menu import Menu
from app.domain.value_objects.recommendation_context import RecommendationContext


class BasicRecommender(RecommendationStrategy):
    """기본 메뉴 추천 전략 (랜덤 기반)"""
    
    def __init__(self, menu_repository: MenuRepository):
        self._menu_repo = menu_repository
    
    def recommend(
        self,
        context: RecommendationContext,
        limit: int = 5,
    ) -> list[Menu]:
        """모든 메뉴에서 필터링 후 랜덤 추천"""
        all_menus = self._menu_repo.get_all()
        
        filtered_menus = all_menus

        # 1. 제외 카테고리 필터링
        if context.excluded_categories:
            filtered_menus = [
                m for m in filtered_menus
                if m.category.value not in context.excluded_categories
            ]

        # 2. 포함 카테고리 필터링 (있으면 해당 카테고리만 남김)
        if context.included_categories:
            filtered_menus = [
                m for m in filtered_menus
                if m.category.value in context.included_categories
            ]
            
        # 3. 속성 필터링 (Attributes)
        if context.attributes:
            filtered_menus = [
                m for m in filtered_menus
                if self._matches_attributes(m, context.attributes)
            ]
        
        if not filtered_menus:
            return []
            
        # 4. 랜덤 샘플링
        sample_size = min(limit, len(filtered_menus))
        return random.sample(filtered_menus, sample_size)
    
    def _matches_attributes(self, menu: Menu, attributes: dict[str, bool]) -> bool:
        """메뉴가 주어진 속성 조건들을 모두 만족하는지 검사"""
        for attr_name, attr_value in attributes.items():
            # 메뉴 객체에 해당 속성이 없으면 무시
            if not hasattr(menu, attr_name):
                continue
                
            menu_val = getattr(menu, attr_name)
            
            # None인 경우(데이터 없음)는 조건 불만족으로 간주 (엄격 모드)
            if menu_val is None:
                return False
                
            if menu_val != attr_value:
                return False
                
        return True
    
    def get_all_menus(self) -> list[Menu]:
        return self._menu_repo.get_all()
