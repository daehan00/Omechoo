from app.domain.interfaces.locator import RestaurantLocator
from app.domain.entities.restaurant import Restaurant, Location
from app.infrastructure.repositories.in_memory.restaurant import InMemoryRestaurantRepository


class MockRestaurantLocator(RestaurantLocator):
    """테스트용 Mock 식당 검색기 (In-Memory Repo 사용)"""
    
    def __init__(self):
        self._repo = InMemoryRestaurantRepository()
        
    async def search(
        self,
        query: str,
        location: Location,
        radius_km: float,
    ) -> list[Restaurant]:
        """In-Memory Repo에서 메뉴 이름(query)으로 검색"""
        # 비동기 인터페이스지만, 인메모리 작업이므로 바로 반환
        return self._repo.search_by_menu(query)