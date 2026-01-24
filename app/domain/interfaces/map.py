from abc import ABC, abstractmethod
from app.domain.entities.restaurant import Location

class MapProvider(ABC):

    @abstractmethod
    async def search_address(self, query: str) -> Location | None:
        ...
    
    @abstractmethod
    async def reverse_geocode(self, lat: float, long: float) -> str | None:
        ...