from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import Settings

settings = Settings()

# check_same_thread=False는 SQLite에서만 필요 (FastAPI 비동기 환경 대응)
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
