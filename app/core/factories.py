from functools import lru_cache
from sqlalchemy.orm import Session
from app.core.config import Settings
from app.domain.interfaces.repository import MenuRepository
from app.services.menu_recommendation import MenuRecommendationService
from app.services.restaurant_search import RestaurantSearchService
from app.services.restaurant_detail import RestaurantDetailService
from app.infrastructure.adapters.recommender.basic import BasicRecommender
from app.infrastructure.repositories.in_memory.menu import InMemoryMenuRepository
from app.infrastructure.repositories.sqlalchemy.restaurant_detail import RestaurantDetailRepository
from app.infrastructure.scrapers.kakao import KakaoRestaurantScraper
from app.infrastructure.adapters.map.mock import MockRestaurantLocator
from app.infrastructure.adapters.map.kakao import KakaoSearchLocator


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
    settings = get_settings()

    # 카카오 API 키가 설정되어 있으면 KakaoSearchLocator 사용
    if settings.KAKAO_REST_API_KEY:
        locator = KakaoSearchLocator(
            settings.KAKAO_REST_API_KEY,
            settings.KAKAO_BASE_URL
        )
    else:
        # 없으면 Mock 사용 (개발용)
        locator = MockRestaurantLocator()
        print("MockRestaurantLocator initiated!!!")
    
    return RestaurantSearchService(locator)


def create_restaurant_detail_service(db: Session) -> RestaurantDetailService:
    """식당 상세 정보 서비스 생성"""
    repo = RestaurantDetailRepository(db)
    scraper = KakaoRestaurantScraper()
    return RestaurantDetailService(repo, scraper)