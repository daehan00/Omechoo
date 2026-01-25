from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func
from app.db.base import Base

class RestaurantDetailModel(Base):
    __tablename__ = "restaurant_details"

    id = Column(String, primary_key=True, index=True)  # 카카오 place_id
    
    rating = Column(String, default="0.0")
    review_count = Column(String, default="0")
    blog_review_count = Column(String, default="0")
    
    # 리스트 데이터는 JSON으로 저장
    business_status = Column(JSON, default=list) 
    menus = Column(JSON, default=list)
    
    # UTC 타임존 기준
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
