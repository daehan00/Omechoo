from pydantic import BaseModel
from datetime import datetime


class LocationResponse(BaseModel):
    latitude: float
    longitude: float
    address: str | None = None


class RestaurantResponse(BaseModel):
    """식당 응답"""
    id: str
    name: str
    category: str
    location: LocationResponse | None = None
    urls: list[str] | None = None
    menu_items: list[str] | None = None


class RestaurantSearchResponse(BaseModel):
    """식당 검색 응답"""
    success: bool = True
    data: list[RestaurantResponse]
    meta: dict
    
    @staticmethod
    def create(restaurants: list) -> "RestaurantSearchResponse":
        return RestaurantSearchResponse(
            data=[
                RestaurantResponse(
                    id=r.id,
                    name=r.name,
                    category=r.category,
                    location=LocationResponse(
                        latitude=r.location.latitude,
                        longitude=r.location.longitude,
                        address=r.location.address
                    ) if r.location else None,
                    urls=r.urls,
                    menu_items=r.menu_items
                )
                for r in restaurants
            ],
            meta={
                "timestamp": datetime.now().isoformat(),
                "count": len(restaurants),
            }
        )
