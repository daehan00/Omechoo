from sqlalchemy.orm import Session
from app.domain.interfaces.repository import MenuRepository
from app.domain.entities.menu import Menu, MenuCategory
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
            category=MenuCategory(model.category),
            description=str(model.description) if model.description is not None else None,
            search_keywords=list(model.search_keywords) if model.search_keywords is not None else [],  # type: ignore
            is_hot=bool(model.is_hot) if model.is_hot is not None else None,
            is_soup=bool(model.is_soup) if model.is_soup is not None else None,
            is_noodle=bool(model.is_noodle) if model.is_noodle is not None else None,
            is_rice=bool(model.is_rice) if model.is_rice is not None else None,
            is_bread=bool(model.is_bread) if model.is_bread is not None else None,
            is_spicy=bool(model.is_spicy) if model.is_spicy is not None else None,
            is_sweet=bool(model.is_sweet) if model.is_sweet is not None else None,
            is_salty=bool(model.is_salty) if model.is_salty is not None else None,
            is_sour=bool(model.is_sour) if model.is_sour is not None else None,
            is_bitter=bool(model.is_bitter) if model.is_bitter is not None else None,
            is_greasy=bool(model.is_greasy) if model.is_greasy is not None else None,
            is_crispy=bool(model.is_crispy) if model.is_crispy is not None else None,
            is_chewy=bool(model.is_chewy) if model.is_chewy is not None else None,
            is_soft=bool(model.is_soft) if model.is_soft is not None else None,
            is_meat=bool(model.is_meat) if model.is_meat is not None else None,
            is_seafood=bool(model.is_seafood) if model.is_seafood is not None else None,
            is_vegetable=bool(model.is_vegetable) if model.is_vegetable is not None else None,
            is_breakfast=bool(model.is_breakfast) if model.is_breakfast is not None else None,
            is_lunch=bool(model.is_lunch) if model.is_lunch is not None else None,
            is_dinner=bool(model.is_dinner) if model.is_dinner is not None else None,
            is_snack=bool(model.is_snack) if model.is_snack is not None else None,
            is_late_night=bool(model.is_late_night) if model.is_late_night is not None else None,
            is_hangover=bool(model.is_hangover) if model.is_hangover is not None else None,
            is_alcohol_pairing=bool(model.is_alcohol_pairing) if model.is_alcohol_pairing is not None else None,
            is_vegan=bool(model.is_vegan) if model.is_vegan is not None else None,
            is_vegetarian=bool(model.is_vegetarian) if model.is_vegetarian is not None else None,
            is_high_protein=bool(model.is_high_protein) if model.is_high_protein is not None else None,
            is_low_carb=bool(model.is_low_carb) if model.is_low_carb is not None else None,
            is_light=bool(model.is_light) if model.is_light is not None else None,
            is_seasonal=bool(model.is_seasonal) if model.is_seasonal is not None else None,
            is_popular=bool(model.is_popular) if model.is_popular is not None else None,
        )
