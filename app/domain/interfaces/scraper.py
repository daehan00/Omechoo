from abc import ABC, abstractmethod
from app.domain.entities.restaurant_detail import RestaurantDetail

class RestaurantScraper(ABC):
    """식당 정보 스크래퍼 인터페이스"""
    
    @abstractmethod
    async def get_details(self, url: str) -> RestaurantDetail:
        """URL에서 식당 상세 정보를 수집합니다."""
        ...
