import logging
from typing import cast
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded


import sys
from pathlib import Path
if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys.executable).parent
else:
    BASE_DIR = Path(__file__).parent

load_dotenv()

from app.api.routes import menu, restaurant, health, room
from app.core.config import Settings
from app.db.base import Base
from app.db.session import engine
from app.models import restaurant_detail  # 모델 등록을 위해 필수
from app.models import room as room_model  # Room 모델 등록

logging.basicConfig(level=logging.INFO)

settings = Settings()

# DB 테이블 생성 (개발 편의상 자동 생성)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
)

# Rate Limiting
app.state.limiter = menu.limiter  # share limiter instance
app.add_exception_handler(RateLimitExceeded, cast(type[Exception], _rate_limit_exceeded_handler))  # type: ignore

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(menu.router)
app.include_router(restaurant.router)
app.include_router(health.router)
app.include_router(room.router)

if __name__ == "__main__":
    print("\n".join([f"{k}: {v}" for k, v in settings.model_dump().items()]))
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)