import random
from typing import Any
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
        
        # 4. 랜덤 샘플링
        if not filtered_menus:
            return []
            
        sample_size = min(limit, len(filtered_menus))
        return random.sample(filtered_menus, sample_size)
    
    def get_all_menus(self) -> list[Menu]:
        """모든 메뉴 조회"""
        return self._menu_repo.get_all()
    
    def _matches_attributes(self, menu: Menu, attributes: dict[str, Any]) -> bool:
        """메뉴가 주어진 속성 조건들을 모두 만족하는지 검사"""
        for attr_key, attr_value in attributes.items():
            # 1. 태그 확인 (키가 대문자인 경우 태그로 간주하거나, 별도 규칙 적용)
            # 여기서는 편의상 value가 bool이고 True인 경우 태그 포함 여부 확인으로 처리할 수도 있음
            # 하지만 더 명확하게는 attr_key가 Menu 필드에 없으면 태그에서 찾도록 함
            
            if hasattr(menu, attr_key):
                # 엔티티 필드 값 비교 (MainBase, Spiciness 등)
                menu_val = getattr(menu, attr_key)
                
                # Enum인 경우 value로 비교
                if hasattr(menu_val, "value"):
                    menu_val = menu_val.value
                
                # IntEnum 등은 숫자로 비교되므로 그대로 둠
                if menu_val != attr_value:
                    return False
            else:
                # 필드에 없으면 tags에서 확인 (대소문자 무시 등 유연하게 처리)
                # 요청이 "SOUP": True 로 오면 tags에 "SOUP"이 있어야 함
                if attr_key.upper() not in menu.tags:
                    return False
                
        return True