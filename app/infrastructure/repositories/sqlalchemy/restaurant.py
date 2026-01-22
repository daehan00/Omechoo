from sqlalchemy.orm import Session
from app.domain.interfaces.repository import RestaurantRepository
from app.domain.entities.restaurant import Restaurant, Location
from app.models.restaurant import RestaurantModel


class SQLAlchemyRestaurantRepository(RestaurantRepository):
    """SQLAlchemy 기반 식당 저장소"""
    
    def __init__(self, session: Session):
        self._session = session
        
    def search_by_menu(self, menu_name: str) -> list[Restaurant]:
        # PostgreSQL의 ARRAY 타입을 사용하여 검색
        # 예: menu_items @> ARRAY[menu_name]
        # 여기서는 간단히 구현 (실제로는 더 복잡한 쿼리 필요할 수 있음)
        models = self._session.query(RestaurantModel).filter(
            RestaurantModel.menu_items.contains([menu_name])
        ).all()
        return [self._to_entity(m) for m in models]
    
    def get_by_id(self, restaurant_id: str) -> Restaurant | None:
        model = self._session.query(RestaurantModel).filter(
            RestaurantModel.id == restaurant_id
        ).first()
        return self._to_entity(model) if model else None

    @staticmethod
    def _to_entity(model: RestaurantModel) -> Restaurant:
        return Restaurant(
            id=model.id,
            name=model.name,
            category=model.category,
            location=Location(
                latitude=model.latitude,
                longitude=model.longitude,
                address=model.address
            ) if model.latitude and model.longitude else None,
            phone=model.phone,
            rating=model.rating,
            urls=model.urls if model.urls else [],
            menu_items=model.menu_items if model.menu_items else []
        )
