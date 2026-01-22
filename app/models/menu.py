from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from app.domain.entities.menu import MenuCategory

Base = declarative_base()


class MenuModel(Base):
    __tablename__ = "menus"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(SQLEnum(MenuCategory), nullable=False)
    description = Column(String)
    
    # 검색용 키워드
    search_keywords = Column(ARRAY(String))

    # 기본 속성
    is_hot = Column(Boolean)
    is_soup = Column(Boolean)
    is_noodle = Column(Boolean)
    is_rice = Column(Boolean)
    is_bread = Column(Boolean)
    
    # 맛
    is_spicy = Column(Boolean)
    is_sweet = Column(Boolean)
    is_salty = Column(Boolean)
    is_sour = Column(Boolean)
    is_bitter = Column(Boolean)
    is_greasy = Column(Boolean)

    # 식감
    is_crispy = Column(Boolean)
    is_chewy = Column(Boolean)
    is_soft = Column(Boolean)

    # 재료
    is_meat = Column(Boolean)
    is_seafood = Column(Boolean)
    is_vegetable = Column(Boolean)

    # 상황
    is_breakfast = Column(Boolean)
    is_lunch = Column(Boolean)
    is_dinner = Column(Boolean)
    is_snack = Column(Boolean)
    is_late_night = Column(Boolean)
    is_hangover = Column(Boolean)
    is_alcohol_pairing = Column(Boolean)

    # 건강
    is_vegan = Column(Boolean)
    is_vegetarian = Column(Boolean)
    is_high_protein = Column(Boolean)
    is_low_carb = Column(Boolean)
    is_light = Column(Boolean)

    # 기타
    is_seasonal = Column(Boolean)
    is_popular = Column(Boolean)
