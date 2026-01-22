from functools import lru_cache
from fastapi import Depends
from app.core.config import Settings
from app.domain.interfaces.repository import MenuRepository
from app.core.factories import (
    get_settings,
    get_menu_repository,
    create_menu_recommendation_service,
    create_restaurant_search_service,
)
from app.services.menu_recommendation import MenuRecommendationService
from app.services.restaurant_search import RestaurantSearchService


def get_menu_service() -> MenuRecommendationService:
    """메뉴 추천 서비스 DI"""
    return create_menu_recommendation_service()


def get_restaurant_service() -> RestaurantSearchService:
    """식당 검색 서비스 DI"""
    return create_restaurant_search_service()


def get_menu_repo() -> MenuRepository:
    """메뉴 저장소 DI"""
    return get_menu_repository()
