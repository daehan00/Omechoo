from app.domain.interfaces.locator import RestaurantLocator
from app.domain.entities.restaurant import Restaurant, Location
from app.infrastructure.repositories.in_memory.restaurant import InMemoryRestaurantRepository


class MockRestaurantLocator(RestaurantLocator):
    """테스트용 Mock 식당 검색기 (In-Memory Repo 사용)"""
    
    def __init__(self):
        self._repo = InMemoryRestaurantRepository()
        
    def search(
        self,
        query: str,
        location: Location,
        radius_km: float,
    ) -> list[Restaurant]:
        """In-Memory Repo에서 메뉴 이름(query)으로 검색"""
        # Phase 1: 실제 거리 계산 없이 단순히 쿼리가 포함된 식당 반환
        return self._repo.search_by_menu(query)
