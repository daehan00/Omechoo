from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from app.models.restaurant_detail import RestaurantDetailModel
from app.domain.entities.restaurant_detail import RestaurantDetail

class RestaurantDetailRepository:
    def __init__(self, session: Session):
        self._session = session
    
    def get(self, place_id: str) -> RestaurantDetailModel | None:
        return self._session.query(RestaurantDetailModel).filter(
            RestaurantDetailModel.id == place_id
        ).first()

    def save(self, place_id: str, detail: RestaurantDetail) -> RestaurantDetailModel:
        # 기존 데이터 조회 (Upsert 방식)
        existing = self.get(place_id)
        
        # 메뉴 데이터 dict 변환
        menus_json = [{"name": m.name, "price": m.price} for m in detail.menus]
        
        if existing:
            # 업데이트
            existing.rating = detail.rating  # type: ignore
            existing.review_count = detail.review_count  # type: ignore
            existing.blog_review_count = detail.blog_review_count  # type: ignore
            existing.business_status = detail.business_status  # type: ignore
            existing.menus = menus_json  # type: ignore
            # JSON 컬럼 변경 감지
            flag_modified(existing, "business_status")
            flag_modified(existing, "menus")
            # SQLAlchemy가 변경 감지 후 커밋 시 updated_at 갱신
        else:
            # 신규 생성
            new_detail = RestaurantDetailModel(
                id=place_id,
                rating=detail.rating,
                review_count=detail.review_count,
                blog_review_count=detail.blog_review_count,
                business_status=detail.business_status,
                menus=menus_json
            )
            self._session.add(new_detail)
            existing = new_detail
        
        self._session.commit()
        self._session.refresh(existing)
        return existing
