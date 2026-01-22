from abc import ABC, abstractmethod
from app.domain.entities.menu import Menu, MenuCategory
from app.domain.entities.restaurant import Restaurant


class MenuRepository(ABC):
    """메뉴 저장소 인터페이스"""
    
    @abstractmethod
    def get_all(self) -> list[Menu]:
        """모든 메뉴 조회"""
        ...
    
    @abstractmethod
    def get_by_category(self, category: MenuCategory) -> list[Menu]:
        """카테고리별 메뉴 조회"""
        ...
    
    @abstractmethod
    def get_by_id(self, menu_id: str) -> Menu | None:
        """ID로 메뉴 조회"""
        ...


class RestaurantRepository(ABC):
    """식당 저장소 인터페이스"""
    
    @abstractmethod
    def search_by_menu(self, menu_name: str) -> list[Restaurant]:
        """메뉴로 식당 검색"""
        ...
    
    @abstractmethod
    def get_by_id(self, restaurant_id: str) -> Restaurant | None:
        """ID로 식당 조회"""
        ...
