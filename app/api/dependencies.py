from functools import lru_cache
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.config import Settings
from app.domain.interfaces.repository import MenuRepository
from app.core.factories import (
    get_settings,
    get_menu_repository,
    create_menu_recommendation_service,
    create_restaurant_search_service,
    create_restaurant_detail_service,
)
from app.services.menu_recommendation import MenuRecommendationService
from app.services.restaurant_search import RestaurantSearchService
from app.services.restaurant_detail import RestaurantDetailService
from app.services.room_service import RoomService
from app.infrastructure.repositories.sqlalchemy.room import (
    SQLAlchemyRoomRepository,
    SQLAlchemyParticipantRepository,
    SQLAlchemyVoteRepository,
)
from app.db.session import get_db


def get_menu_service() -> MenuRecommendationService:
    """메뉴 추천 서비스 DI"""
    return create_menu_recommendation_service()


def get_restaurant_service() -> RestaurantSearchService:
    """식당 검색 서비스 DI"""
    return create_restaurant_search_service()


def get_menu_repo() -> MenuRepository:
    """메뉴 저장소 DI"""
    return get_menu_repository()


def get_restaurant_detail_service(
    db: Session = Depends(get_db)
) -> RestaurantDetailService:
    """식당 상세 정보 서비스 DI"""
    return create_restaurant_detail_service(db)


def get_room_service(db: Session = Depends(get_db)) -> RoomService:
    """투표 방 서비스 DI"""
    room_repo = SQLAlchemyRoomRepository(db)
    participant_repo = SQLAlchemyParticipantRepository(db)
    vote_repo = SQLAlchemyVoteRepository(db)
    return RoomService(room_repo, participant_repo, vote_repo)
