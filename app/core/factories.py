from functools import lru_cache
from app.core.config import Settings
from app.domain.interfaces.repository import MenuRepository
from app.services.menu_recommendation import MenuRecommendationService
from app.services.restaurant_search import RestaurantSearchService
from app.infrastructure.adapters.recommender.basic import BasicRecommender
from app.infrastructure.repositories.in_memory.menu import InMemoryMenuRepository
from app.infrastructure.adapters.map.mock import MockRestaurantLocator


@lru_cache
def get_settings() -> Settings:
    return Settings()


@lru_cache
def get_menu_repository() -> MenuRepository:
    """메뉴 저장소 (Singleton)"""
    return InMemoryMenuRepository()


def create_menu_recommendation_service() -> MenuRecommendationService:
    """메뉴 추천 서비스 생성"""
    menu_repo = get_menu_repository()
    recommender = BasicRecommender(menu_repo)
    return MenuRecommendationService(recommender)


def create_restaurant_search_service() -> RestaurantSearchService:
    """식당 검색 서비스 생성"""
    # Phase 1: Mock Locator 사용
    locator = MockRestaurantLocator()
    return RestaurantSearchService(locator)
