from typing import Any
from pydantic import BaseModel
from datetime import datetime
from app.domain.entities.restaurant import Restaurant, Location


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
    distance: int | None = None


class RestaurantSearchResponse(BaseModel):
    """식당 검색 응답"""
    success: bool = True
    data: list[RestaurantResponse]
    meta: dict
    
    @staticmethod
    def create(
        restaurants: list[Restaurant],
        location: Location,
    ) -> "RestaurantSearchResponse":
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
                    menu_items=r.menu_items,
                    distance=r.distance
                )
                for r in restaurants
            ],
            meta={
                "timestamp": datetime.now().isoformat(),
                "count": len(restaurants),
                "latitude": location.latitude,
                "longitude": location.longitude
            }
        )


class MenuResponse(BaseModel):
    name: str
    price: str


class RestaurantDetailResponse(BaseModel):
    """식당 상세 정보 응답 (크롤링 결과)"""
    success: bool = True
    data: dict
    meta: dict

    @staticmethod
    def create(detail: Any) -> "RestaurantDetailResponse":
        return RestaurantDetailResponse(
            data={
                "rating": detail.rating,
                "review_count": detail.review_count,
                "blog_review_count": detail.blog_review_count,
                "business_status": detail.business_status,
                "menus": [
                    {"name": m.name, "price": m.price}
                    for m in detail.menus
                ]
            },
            meta={
                "timestamp": datetime.now().isoformat(),
                "source": "kakao_map_crawl"
            }
        )
