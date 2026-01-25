from pydantic import BaseModel, Field


class RestaurantSearchRequest(BaseModel):
    """식당 검색 요청"""
    
    menu_id: str = Field(..., description="선택한 메뉴 ID")
    latitude: float = Field(..., description="현재 위도")
    longitude: float = Field(..., description="현재 경도")
    radius_km: float = Field(default=1.0, description="검색 반경(km)")
    max_result: int = Field(default=50, description="최대 검색 갯수")


class RestaurantCrawlRequest(BaseModel):
    """식당 상세 정보 크롤링 요청"""
    url: str = Field(..., description="카카오맵 상세 페이지 URL")
