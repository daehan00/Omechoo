from app.domain.interfaces.locator import RestaurantLocator
from app.domain.entities.menu import Menu
from app.domain.entities.restaurant import Restaurant, Location


class RestaurantSearchService:
    """식당 검색 유스케이스 (지연 검증 & Fallback 전략)"""
    
    def __init__(self, locator: RestaurantLocator):
        self._locator = locator
    
    async def search_by_menu(
        self,
        menu: Menu,
        location: Location,
        radius_km: float = 1.0,
        max_result: int = 50,
    ) -> list[Restaurant]:
        """메뉴로 식당 검색
        
        전략:
        1. Keyword Mapping: 메뉴명 대신 매핑된 '검색 키워드' 사용
        2. Lazy Validation & Fallback:
           - 1차: 반경 1km 검색
           - 실패 시: 반경 3km 확장 검색
        """    
        # 1. 키워드 결정 (매핑된 키워드 없으면 메뉴명 사용)
        # keyword = " ".join(menu.search_keywords) if menu.search_keywords else menu.name
        keyword = menu.name
                
        # 2. 검색 실행 (Fallback 로직)
        # 1차 시도
        results = await self._locator.search(keyword, location, radius_km, max_result)
        
        # 실패 시 Fallback: radius + 2km
        if not results:
            results = await self._locator.search(keyword, location, radius_km+2, max_result)
        
        return results