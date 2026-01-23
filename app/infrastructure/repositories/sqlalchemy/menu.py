from typing import cast
from sqlalchemy.orm import Session
from app.domain.interfaces.repository import MenuRepository
from app.domain.entities.menu import Menu, MenuCategory, MealTime, MainBase, Spiciness, Temperature, Heaviness
from app.models.menu import MenuModel


class SQLAlchemyMenuRepository(MenuRepository):
    """SQLAlchemy 기반 메뉴 저장소"""
    
    def __init__(self, session: Session):
        self._session = session
    
    def get_all(self) -> list[Menu]:
        models = self._session.query(MenuModel).all()
        return [self._to_entity(m) for m in models]
    
    def get_by_category(self, category: MenuCategory) -> list[Menu]:
        models = self._session.query(MenuModel).filter(
            MenuModel.category == category
        ).all()
        return [self._to_entity(m) for m in models]
    
    def get_by_id(self, menu_id: str) -> Menu | None:
        model = self._session.query(MenuModel).filter(
            MenuModel.id == menu_id
        ).first()
        return self._to_entity(model) if model else None
    
    @staticmethod
    def _to_entity(model: MenuModel) -> Menu:
        """ORM 모델 → 엔티티 변환"""
        return Menu(
            id=str(model.id),
            name=str(model.name),
            category=MenuCategory(str(model.category)),
            description=str(model.description) if model.description is not None else None,
            search_keywords=list(model.search_keywords) if model.search_keywords is not None else [], # type: ignore
            
            # 핵심 속성 매핑
            main_base=MainBase(str(model.main_base)),
            spiciness=Spiciness(str(model.spiciness)),
            temperature=Temperature(str(model.temperature)),
            heaviness=Heaviness(str(model.heaviness)),
            
            # 배열 -> Set/Enum 변환
            available_times={MealTime(t) for t in (list(model.available_times) if model.available_times is not None else [])}, # type: ignore
            tags=set(list(model.tags) if model.tags is not None else []) #type: ignore
        )
