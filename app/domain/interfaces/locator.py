from abc import ABC, abstractmethod
from app.domain.entities.restaurant import Restaurant, Location


class RestaurantLocator(ABC):
    """식당 검색 인터페이스"""
    
    @abstractmethod
    async def search(
        self,
        query: str,
        location: Location,
        radius_km: float,
    ) -> list[Restaurant]:
        """키워드로 식당 검색
        
        Args:
            query: 검색 키워드 (예: "떡볶이")
            location: 검색 중심 위치
            radius_km: 검색 반경 (km)
            
        Returns:
            식당 목록
        """
        ...