from app.domain.interfaces.locator import RestaurantLocator
from app.domain.entities.menu import Menu
from app.domain.entities.restaurant import Restaurant, Location


class RestaurantSearchService:
    """식당 검색 유스케이스 (지연 검증 & Fallback 전략)"""
    
    def __init__(self, locator: RestaurantLocator):
        self._locator = locator
    
    def search_by_menu(
        self,
        menu: Menu,
        location: Location,
    ) -> list[Restaurant]:
        """메뉴로 식당 검색
        
        전략:
        1. Keyword Mapping: 메뉴명 대신 매핑된 '검색 키워드' 사용
        2. Lazy Validation & Fallback:
           - 1차: 반경 1km 검색
           - 실패 시: 반경 3km 확장 검색
        """
        # 1. 키워드 결정 (매핑된 키워드 없으면 메뉴명 사용)
        keywords = menu.search_keywords if menu.search_keywords else [menu.name]
        
        found_restaurants: dict[str, Restaurant] = {} # 중복 제거용
        
        # 2. 검색 실행 (Fallback 로직)
        for keyword in keywords:
            # 1차 시도: 1km
            results = self._locator.search(keyword, location, radius_km=1.0)
            
            # 실패 시 Fallback: 3km
            if not results:
                results = self._locator.search(keyword, location, radius_km=3.0)
            
            # 결과 병합 (중복 제거)
            for r in results:
                if r.id not in found_restaurants:
                    found_restaurants[r.id] = r
                
        return list(found_restaurants.values())
