from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.dependencies import get_menu_service
from app.services.menu_recommendation import MenuRecommendationService
from app.schemas.requests.menu import MenuRecommendRequest
from app.schemas.responses.menu import MenuRecommendResponse, MenuResponse

router = APIRouter(prefix="/api/menu", tags=["menu"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/all", response_model=MenuRecommendResponse)
async def all_menu(
    request: Request,
    service: MenuRecommendationService = Depends(get_menu_service),
):
    """모든 메뉴 조회 API"""
    all_menu = service.get_all_menus()
    return MenuRecommendResponse.create(all_menu)

@router.post("/recommend/basic", response_model=MenuRecommendResponse)
# @limiter.limit("10/minute")
async def recommend_menu(
    request: Request,
    body: MenuRecommendRequest,
    service: MenuRecommendationService = Depends(get_menu_service),
):
    """메뉴 추천 API"""
    menus = service.recommend(**body.model_dump())
    return MenuRecommendResponse.create(menus)

@router.post("/recommend/language", response_model=MenuRecommendResponse)
async def recommend_menu_by_lang(
    request: Request,
    body: MenuRecommendRequest,
    service: MenuRecommendationService = Depends(get_menu_service),
):
    ...
