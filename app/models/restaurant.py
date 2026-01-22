from sqlalchemy import Column, String, Float, ARRAY
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class RestaurantModel(Base):
    __tablename__ = "restaurants"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String)
    phone = Column(String)
    rating = Column(Float)
    
    urls = Column(ARRAY(String))
    menu_items = Column(ARRAY(String))  # PostgreSQL ARRAY
