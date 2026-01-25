from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.dependencies import (
    get_restaurant_service, 
    get_menu_repo,
    get_restaurant_detail_service
)
from app.services.restaurant_search import RestaurantSearchService
from app.services.restaurant_detail import RestaurantDetailService
from app.domain.interfaces.repository import MenuRepository
from app.domain.entities.restaurant import Location
from app.schemas.requests.restaurant import RestaurantSearchRequest, RestaurantCrawlRequest
from app.schemas.responses.restaurant import (
    RestaurantSearchResponse, 
    RestaurantDetailResponse
)

router = APIRouter(prefix="/api/restaurant", tags=["restaurant"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/search", response_model=RestaurantSearchResponse)
@limiter.limit("10/minute")
async def search_restaurants(
    request: Request,
    body: RestaurantSearchRequest,
    service: RestaurantSearchService = Depends(get_restaurant_service),
    menu_repo: MenuRepository = Depends(get_menu_repo),
):
    """메뉴 기반 식당 검색 API"""
    # 1. 메뉴 조회
    menu = menu_repo.get_by_id(body.menu_id)
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
        
    # 2. 식당 검색
    location = Location(
        latitude=body.latitude,
        longitude=body.longitude
    )
    
    # 비동기 호출
    restaurants = await service.search_by_menu(
        menu, location, body.radius_km, body.max_result
    )
    
    return RestaurantSearchResponse.create(restaurants, location)


@router.post("/detail", response_model=RestaurantDetailResponse)
@limiter.limit("3/second")
async def crawl_restaurant_detail(
    request: Request,
    body: RestaurantCrawlRequest,
    service: RestaurantDetailService = Depends(get_restaurant_detail_service),
):
    """식당 상세 정보 크롤링 API (캐싱 적용)
    
    - 1차: DB 캐시 조회 (유효기간 3일)
    - 2차: 캐시 없거나 만료 시 실시간 크롤링 후 DB 저장
    """
    
    # 서비스 호출
    detail = await service.get_detail(body.url)
    
    return RestaurantDetailResponse.create(detail)
