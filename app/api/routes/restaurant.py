from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.dependencies import get_restaurant_service, get_menu_repo
from app.services.restaurant_search import RestaurantSearchService
from app.domain.interfaces.repository import MenuRepository
from app.domain.entities.restaurant import Location
from app.schemas.requests.restaurant import RestaurantSearchRequest, RestaurantCrawlRequest
from app.schemas.responses.restaurant import (
    RestaurantSearchResponse, 
    RestaurantDetailResponse
)
from app.infrastructure.scrapers.kakao import KakaoRestaurantScraper

router = APIRouter(prefix="/api/restaurant", tags=["restaurant"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/search", response_model=RestaurantSearchResponse)
@limiter.limit("20/minute")
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
@limiter.limit("5/minute")
async def crawl_restaurant_detail(
    request: Request,
    body: RestaurantCrawlRequest,
):
    """식당 상세 정보 크롤링 API (실시간)
    
    주의: Playwright 브라우저를 띄워 크롤링하므로 응답까지 2~5초 소요될 수 있습니다.
    """
    scraper = KakaoRestaurantScraper()
    detail = await scraper.get_details(body.url)
    
    return RestaurantDetailResponse.create(detail)
