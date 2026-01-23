import pytest
from datetime import datetime
from app.domain.interfaces.repository import MenuRepository
from app.domain.entities.menu import (
    Menu, MenuCategory, MainBase, Spiciness, Temperature, Heaviness, MealTime
)
from app.infrastructure.adapters.recommender.basic import BasicRecommender
from app.services.menu_recommendation import MenuRecommendationService


class MockMenuRepository(MenuRepository):
    """테스트용 Mock Repository (고정된 데이터 제공)"""
    def __init__(self):
        self._menus = [
            Menu(
                id="1", name="매운라면", category=MenuCategory.KOREAN,
                main_base=MainBase.NOODLE, spiciness=Spiciness.SPICY,
                tags={"SOUP", "QUICK"}
            ),
            Menu(
                id="2", name="비빔밥", category=MenuCategory.KOREAN,
                main_base=MainBase.RICE, spiciness=Spiciness.LITTLE,
                tags={"VEGETABLE", "HEALTHY"}
            ),
            Menu(
                id="3", name="초밥", category=MenuCategory.JAPANESE,
                main_base=MainBase.RICE, spiciness=Spiciness.NONE,
                tags={"SEAFOOD", "DATE"}
            ),
            Menu(
                id="4", name="스테이크", category=MenuCategory.WESTERN,
                main_base=MainBase.MEAT, spiciness=Spiciness.NONE,
                heaviness=Heaviness.HEAVY, tags={"DATE", "EXPENSIVE"}
            ),
            Menu(
                id="5", name="샐러드", category=MenuCategory.WESTERN,
                main_base=MainBase.VEGETABLE, spiciness=Spiciness.NONE,
                heaviness=Heaviness.LIGHT, tags={"DIET", "LIGHT"}
            ),
        ]

    def get_all(self) -> list[Menu]:
        return self._menus

    def get_by_category(self, category: MenuCategory) -> list[Menu]:
        return [m for m in self._menus if m.category == category]

    def get_by_id(self, menu_id: str) -> Menu | None:
        return next((m for m in self._menus if m.id == menu_id), None)


@pytest.fixture
def menu_repository():
    return MockMenuRepository()


@pytest.fixture
def basic_recommender(menu_repository):
    return BasicRecommender(menu_repository)


@pytest.fixture
def menu_service(basic_recommender):
    return MenuRecommendationService(basic_recommender)
