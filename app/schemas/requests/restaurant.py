from pydantic import BaseModel, Field


class RestaurantSearchRequest(BaseModel):
    """식당 검색 요청"""
    
    menu_id: str = Field(..., description="선택한 메뉴 ID")
    latitude: float = Field(..., description="현재 위도")
    longitude: float = Field(..., description="현재 경도")
