from sqlalchemy import Column, String, Integer, Enum as SQLEnum, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from app.domain.entities.menu import MenuCategory, MainBase, Spiciness, Temperature, Heaviness, MealTime

Base = declarative_base()


class MenuModel(Base):
    __tablename__ = "menus"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(SQLEnum(MenuCategory), nullable=False)
    description = Column(String)
    
    # 검색용 키워드
    search_keywords = Column(ARRAY(String))

    # --- [B] 핵심 속성 (Scoring Axes) ---
    main_base = Column(SQLEnum(MainBase), nullable=False)
    spiciness = Column(SQLEnum(Spiciness), default=Spiciness.NONE) # IntEnum이지만 DB에는 Enum이나 Integer로 저장 가능. 여기서는 Enum으로 처리
    temperature = Column(SQLEnum(Temperature), default=Temperature.NEUTRAL)
    heaviness = Column(SQLEnum(Heaviness), default=Heaviness.MEDIUM)

    # --- [C] 식사 시간 (Set -> Array) ---
    # Enum 값들의 리스트로 저장
    available_times = Column(ARRAY(String)) 

    # --- [D] 부가 속성 (Tags) ---
    tags = Column(ARRAY(String))