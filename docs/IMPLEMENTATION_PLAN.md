# Omechoo 구현 계획

> 아키텍처 가이드: [ARCHITECTURE.md](./ARCHITECTURE.md)  
> 코딩 규칙: [CODING_RULES.md](./CODING_RULES.md)

---

## 📋 프로젝트 개요

### 목표
메뉴 추천 → 사용자 피드백 → 식당 검색의 2단계 독립 프로세스 구현

### 기술 스택

| 카테고리 | 선택 | 이유 |
|---------|------|------|
| 웹 프레임워크 | FastAPI | 비동기 지원, 타입 힌팅, 자동 문서화 |
| 데이터베이스 | PostgreSQL + SQLAlchemy | JSONB 지원, ORM 추상화 |
| 캐싱 | Redis (선택적) | 메뉴/식당 데이터 캐싱 |
| HTTP 클라이언트 | httpx | 비동기 지원 |
| 검증/설정 | Pydantic v2 | 타입 안전성 |
| 테스팅 | pytest + pytest-asyncio | 비동기 테스트 지원 |
| 린팅/포맷 | ruff + mypy | 빠른 린팅, 타입 체크 |

---

## 🗺️ Phase별 구현 계획

### Phase 1: 핵심 기능 구현 (MVP)
**목표**: 기본 메뉴 추천 + 식당 검색 (외부 API 없이)  
**기간**: 2주

```
[완료 기준]
✓ 사용자가 카테고리 선택 → 메뉴 추천 받기
✓ 추천된 메뉴로 식당 검색
✓ Clean Architecture 구조 확립
```

### Phase 2: 날씨 기반 추천
**목표**: 날씨 API 연동 및 날씨 기반 추천 전략  
**기간**: 1주

### Phase 3: 위치 기반 근처 식당
**목표**: 지도 API 연동 및 실제 식당 데이터  
**기간**: 1주

### Phase 4: AI 분석 (향후)
**목표**: 리뷰 AI 분석, 개인화 추천  
**기간**: TBD

---

## 📅 Phase 1 상세 구현 계획

### 1.1 프로젝트 구조 재구성

#### 작업 내용
기존 `app/` 구조를 Clean Architecture에 맞게 재구성

```bash
# 생성할 디렉토리 구조
app/
├── domain/
│   ├── __init__.py
│   ├── entities/
│   │   ├── __init__.py
│   │   ├── menu.py           # Menu, MenuCategory
│   │   ├── restaurant.py      # Restaurant, Location
│   │   └── user.py            # UserPreference (향후)
│   ├── interfaces/
│   │   ├── __init__.py
│   │   ├── recommender.py     # RecommendationStrategy ABC
│   │   ├── locator.py         # RestaurantLocator ABC
│   │   └── repository.py      # Repository ABCs
│   └── value_objects/
│       ├── __init__.py
│       └── recommendation_context.py
│
├── services/
│   ├── __init__.py
│   ├── menu_recommendation.py
│   └── restaurant_search.py
│
├── infrastructure/
│   ├── __init__.py
│   ├── adapters/
│   │   ├── __init__.py
│   │   └── recommender/
│   │       ├── __init__.py
│   │       ├── basic.py        # 기본 추천 알고리즘
│   │       └── random.py       # 랜덤 추천 (개발용)
│   └── repositories/
│       ├── __init__.py
│       └── sqlalchemy/
│           ├── __init__.py
│           ├── menu.py
│           └── restaurant.py
│
├── core/
│   ├── __init__.py
│   ├── config.py
│   ├── exceptions.py
│   ├── factories.py
│   └── logging.py
│
├── api/
│   ├── __init__.py
│   ├── dependencies.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   └── rate_limit.py
│   └── routes/
│       ├── __init__.py
│       ├── menu.py
│       ├── restaurant.py
│       └── health.py
│
├── models/              # SQLAlchemy ORM 모델
│   ├── __init__.py
│   ├── menu.py
│   └── restaurant.py
│
├── schemas/             # Pydantic DTO
│   ├── __init__.py
│   ├── requests/
│   │   ├── __init__.py
│   │   ├── menu.py
│   │   └── restaurant.py
│   └── responses/
│       ├── __init__.py
│       ├── menu.py
│       └── restaurant.py
│
└── main.py
```

#### 체크리스트
- [ ] 디렉토리 구조 생성
- [ ] `__init__.py` 파일 생성
- [ ] 기존 코드 마이그레이션

---

### 1.2 Domain Layer 구현

#### Task 1.2.1: 엔티티 정의
**파일**: `app/domain/entities/menu.py`

```python
from enum import Enum
from dataclasses import dataclass


class MenuCategory(str, Enum):
    """메뉴 카테고리"""
    KOREAN = "korean"
    CHINESE = "chinese"
    JAPANESE = "japanese"
    WESTERN = "western"
    ASIAN = "asian"
    CAFE = "cafe"
    FAST_FOOD = "fast_food"


@dataclass
class Menu:
    """메뉴 엔티티"""
    id: str
    name: str
    category: MenuCategory
    description: str | None = None
    
    # 메타데이터 (추천에 활용)
    is_spicy: bool = False
    is_hot: bool = True  # 뜨거운 음식 여부
    is_light: bool = False  # 가벼운 음식 여부

    # 검색 키워드 (식당 검색 시 활용)
    search_keywords: list[str] = None  # 예: ["떡볶이", "분식"]
```

**파일**: `app/domain/entities/restaurant.py`

```python
from dataclasses import dataclass


@dataclass
class Location:
    """위치 정보"""
    latitude: float
    longitude: float
    address: str | None = None


@dataclass
class Restaurant:
    """식당 엔티티"""
    id: str
    name: str
    category: str
    location: Location | None = None
    phone: str | None = None
    rating: float | None = None
    
    # 메뉴 목록 (간단히)
    menu_items: list[str] | None = None
```

#### Task 1.2.2: Value Objects
**파일**: `app/domain/value_objects/recommendation_context.py`

```python
from dataclasses import dataclass
from datetime import datetime


@dataclass
class RecommendationContext:
    """추천 컨텍스트 (추천 시 필요한 모든 정보)"""
    
    # 필수 정보
    timestamp: datetime
    
    # 선택적 정보
    excluded_categories: list[str] | None = None
    user_id: str | None = None  # 향후 개인화용
    
    # 향후 확장
    weather: str | None = None  # Phase 2
    location: tuple[float, float] | None = None  # Phase 3
```

#### Task 1.2.3: 인터페이스 정의
**파일**: `app/domain/interfaces/recommender.py`

```python
from abc import ABC, abstractmethod
from app.domain.entities.menu import Menu
from app.domain.value_objects.recommendation_context import RecommendationContext


class RecommendationStrategy(ABC):
    """메뉴 추천 전략 인터페이스"""
    
    @abstractmethod
    def recommend(
        self,
        context: RecommendationContext,
        limit: int = 5,
    ) -> list[Menu]:
        """메뉴 추천
        
        Args:
            context: 추천 컨텍스트
            limit: 최대 추천 개수
            
        Returns:
            추천된 메뉴 목록
        """
        ...
```

**파일**: `app/domain/interfaces/locator.py`

```python
from abc import ABC, abstractmethod
from app.domain.entities.menu import Menu
from app.domain.entities.restaurant import Restaurant, Location


class RestaurantLocator(ABC):
    """식당 검색 인터페이스"""
    
    @abstractmethod
    def search(
        self,
        query: str,
        location: Location,
        radius_km: float,
    ) -> list[Restaurant]:
        """키워드로 식당 검색
        
        Args:
            query: 검색 키워드 (예: "떡볶이")
            location: 검색 중심 위치
            radius_km: 검색 반경 (km)
            
        Returns:
            식당 목록
        """
        ...
```

**파일**: `app/domain/interfaces/repository.py`

```python
from abc import ABC, abstractmethod
from app.domain.entities.menu import Menu, MenuCategory
from app.domain.entities.restaurant import Restaurant


class MenuRepository(ABC):
    """메뉴 저장소 인터페이스"""
    
    @abstractmethod
    def get_all(self) -> list[Menu]:
        """모든 메뉴 조회"""
        ...
    
    @abstractmethod
    def get_by_category(self, category: MenuCategory) -> list[Menu]:
        """카테고리별 메뉴 조회"""
        ...
    
    @abstractmethod
    def get_by_id(self, menu_id: str) -> Menu | None:
        """ID로 메뉴 조회"""
        ...


class RestaurantRepository(ABC):
    """식당 저장소 인터페이스"""
    
    @abstractmethod
    def search_by_menu(self, menu_name: str) -> list[Restaurant]:
        """메뉴로 식당 검색"""
        ...
    
    @abstractmethod
    def get_by_id(self, restaurant_id: str) -> Restaurant | None:
        """ID로 식당 조회"""
        ...
```

#### 체크리스트
- [ ] 엔티티 정의 완료
- [ ] Value Objects 정의 완료
- [ ] 인터페이스 정의 완료
- [ ] 타입 힌트 확인
- [ ] Docstring 작성 완료

---

### 1.3 Infrastructure Layer 구현

#### Task 1.3.1: 기본 추천 알고리즘
**파일**: `app/infrastructure/adapters/recommender/basic.py`

```python
import random
from app.domain.interfaces.recommender import RecommendationStrategy
from app.domain.interfaces.repository import MenuRepository
from app.domain.entities.menu import Menu
from app.domain.value_objects.recommendation_context import RecommendationContext


class BasicRecommender(RecommendationStrategy):
    """기본 메뉴 추천 전략 (랜덤 기반)"""
    
    def __init__(self, menu_repository: MenuRepository):
        self._menu_repo = menu_repository
    
    def recommend(
        self,
        context: RecommendationContext,
        limit: int = 5,
    ) -> list[Menu]:
        """모든 메뉴에서 랜덤 추천"""
        all_menus = self._menu_repo.get_all()
        
        # 제외 카테고리 필터링
        if context.excluded_categories:
            all_menus = [
                m for m in all_menus
                if m.category not in context.excluded_categories
            ]
        
        # 랜덤 샘플링
        sample_size = min(limit, len(all_menus))
        return random.sample(all_menus, sample_size)
```

#### Task 1.3.2: SQLAlchemy 모델
**파일**: `app/models/menu.py`

```python
from sqlalchemy import Column, String, Boolean, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from app.domain.entities.menu import MenuCategory

Base = declarative_base()


class MenuModel(Base):
    __tablename__ = "menus"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(SQLEnum(MenuCategory), nullable=False)
    description = Column(String)
    is_spicy = Column(Boolean, default=False)
    is_hot = Column(Boolean, default=True)
    is_light = Column(Boolean, default=False)
    search_keywords = Column(ARRAY(String))  # 검색 키워드 목록
```

**파일**: `app/models/restaurant.py`

```python
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
    menu_items = Column(ARRAY(String))  # PostgreSQL ARRAY
```

#### Task 1.3.3: Repository 구현
**파일**: `app/infrastructure/repositories/sqlalchemy/menu.py`

```python
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
            id=model.id,
            name=model.name,
            category=model.category,
            description=model.description,
            is_spicy=model.is_spicy,
            is_hot=model.is_hot,
            is_light=model.is_light,
        )
```

#### Task 1.3.4: In-Memory Repository (개발/테스트용)
**파일**: `app/infrastructure/repositories/in_memory/menu.py`

```python
from app.domain.interfaces.repository import MenuRepository
from app.domain.entities.menu import Menu, MenuCategory


class InMemoryMenuRepository(MenuRepository):
    """테스트/개발용 In-Memory 메뉴 저장소"""
    
    def __init__(self):
        # 샘플 데이터
        self._menus = [
            Menu("1", "김치찌개", MenuCategory.KOREAN, is_spicy=True, is_hot=True),
            Menu("2", "비빔밥", MenuCategory.KOREAN, is_light=True),
            Menu("3", "짜장면", MenuCategory.CHINESE),
            Menu("4", "초밥", MenuCategory.JAPANESE, is_light=True),
            Menu("5", "파스타", MenuCategory.WESTERN),
        ]
    
    def get_all(self) -> list[Menu]:
        return self._menus.copy()
    
    def get_by_category(self, category: MenuCategory) -> list[Menu]:
        return [m for m in self._menus if m.category == category]
    
    def get_by_id(self, menu_id: str) -> Menu | None:
        return next((m for m in self._menus if m.id == menu_id), None)
```

#### 체크리스트
- [ ] 기본 추천 알고리즘 구현
- [ ] SQLAlchemy 모델 정의
- [ ] Repository 구현 (SQLAlchemy + In-Memory)
- [ ] 단위 테스트 작성

---

### 1.4 Service Layer 구현

#### Task 1.4.1: 메뉴 추천 서비스
**파일**: `app/services/menu_recommendation.py`

```python
from datetime import datetime
from app.domain.interfaces.recommender import RecommendationStrategy
from app.domain.entities.menu import Menu
from app.domain.value_objects.recommendation_context import RecommendationContext


class MenuRecommendationService:
    """메뉴 추천 유스케이스"""
    
    def __init__(self, strategy: RecommendationStrategy):
        self._strategy = strategy
    
    def recommend(
        self,
        excluded_categories: list[str] | None = None,
        limit: int = 5,
    ) -> list[Menu]:
        """메뉴 추천
        
        Args:
            excluded_categories: 제외할 카테고리
            limit: 최대 추천 개수
            
        Returns:
            추천 메뉴 목록
        """
        context = RecommendationContext(
            timestamp=datetime.now(),
            excluded_categories=excluded_categories,
        )
        
        return self._strategy.recommend(context, limit)
```

#### Task 1.4.2: 식당 검색 서비스
**파일**: `app/services/restaurant_search.py`

```python
from app.domain.interfaces.locator import RestaurantLocator
from app.domain.entities.menu import Menu
from app.domain.entities.restaurant import Restaurant, Location


class RestaurantSearchService:
    """식당 검색 유스케이스 (지연 검증 & Fallback 전략)"""
    
    def __init__(self, locator: RestaurantLocator):
        self._locator = locator
    
    def search_by_menu(
        self,
        menu: Menu,
        location: Location,
    ) -> list[Restaurant]:
        """메뉴로 식당 검색
        
        전략:
        1. Keyword Mapping: 메뉴명 대신 매핑된 '검색 키워드' 사용
        2. Lazy Validation & Fallback:
           - 1차: 반경 1km 검색
           - 실패 시: 반경 3km 확장 검색
        """
        # 1. 키워드 결정 (매핑된 키워드 없으면 메뉴명 사용)
        keywords = menu.search_keywords if menu.search_keywords else [menu.name]
        
        # 2. 검색 실행 (Fallback 로직)
        for keyword in keywords:
            # 1차 시도: 1km
            results = self._locator.search(keyword, location, radius_km=1.0)
            if results:
                return results
            
            # Fallback: 3km
            results = self._locator.search(keyword, location, radius_km=3.0)
            if results:
                return results
                
        return []
```

#### 체크리스트
- [ ] 서비스 클래스 구현
- [ ] 비즈니스 로직 검증
- [ ] 단위 테스트 작성

---

### 1.5 Core 모듈 구현

#### Task 1.5.1: 설정
**파일**: `app/core/config.py`

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # 앱 기본 설정
    APP_NAME: str = "Omechoo"
    VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    # 데이터베이스
    DATABASE_URL: str = "sqlite:///./omechoo.db"
    
    # API Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 10
    
    # Phase 2+ (미래 확장)
    WEATHER_API_ENABLED: bool = False
    WEATHER_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True
```

#### Task 1.5.2: 예외
**파일**: `app/core/exceptions.py`

```python
class OmechooError(Exception):
    """Base exception"""
    pass


class RecommendationError(OmechooError):
    """추천 실패"""
    pass


class RestaurantNotFoundError(OmechooError):
    """식당을 찾을 수 없음"""
    pass


class ExternalAPIError(OmechooError):
    """외부 API 오류"""
    
    def __init__(self, provider: str, message: str):
        self.provider = provider
        super().__init__(f"[{provider}] {message}")
```

#### Task 1.5.3: 팩토리
**파일**: `app/core/factories.py`

```python
from functools import lru_cache
from app.core.config import Settings
from app.services.menu_recommendation import MenuRecommendationService
from app.services.restaurant_search import RestaurantSearchService
from app.infrastructure.adapters.recommender.basic import BasicRecommender
from app.infrastructure.repositories.in_memory.menu import InMemoryMenuRepository


@lru_cache
def get_settings() -> Settings:
    return Settings()


def create_menu_recommendation_service() -> MenuRecommendationService:
    """메뉴 추천 서비스 생성"""
    menu_repo = InMemoryMenuRepository()  # Phase 1: In-Memory
    recommender = BasicRecommender(menu_repo)
    return MenuRecommendationService(recommender)


def create_restaurant_search_service() -> RestaurantSearchService:
    """식당 검색 서비스 생성"""
    # TODO: Locator 구현 후 주입
    raise NotImplementedError()
```

#### 체크리스트
- [ ] Settings 정의
- [ ] 예외 클래스 정의
- [ ] Factory 함수 작성

---

### 1.6 API Layer 구현

#### Task 1.6.1: Pydantic 스키마
**파일**: `app/schemas/requests/menu.py`

```python
from pydantic import BaseModel, Field


class MenuRecommendRequest(BaseModel):
    """메뉴 추천 요청"""
    
    excluded_categories: list[str] | None = Field(
        default=None,
        description="제외할 카테고리 목록",
        example=["korean", "chinese"]
    )
    limit: int = Field(
        default=5,
        ge=1,
        le=10,
        description="추천 개수 (1-10)"
    )
```

**파일**: `app/schemas/responses/menu.py`

```python
from pydantic import BaseModel
from datetime import datetime


class MenuResponse(BaseModel):
    """메뉴 응답"""
    id: str
    name: str
    category: str
    description: str | None = None


class MenuRecommendResponse(BaseModel):
    """메뉴 추천 응답"""
    success: bool = True
    data: list[MenuResponse]
    meta: dict
    
    @staticmethod
    def create(menus: list) -> "MenuRecommendResponse":
        return MenuRecommendResponse(
            data=[
                MenuResponse(
                    id=m.id,
                    name=m.name,
                    category=m.category.value,
                    description=m.description,
                )
                for m in menus
            ],
            meta={
                "timestamp": datetime.now().isoformat(),
                "count": len(menus),
            }
        )
```

#### Task 1.6.2: 의존성 주입
**파일**: `app/api/dependencies.py`

```python
from functools import lru_cache
from fastapi import Depends
from app.core.config import Settings
from app.core.factories import (
    get_settings,
    create_menu_recommendation_service,
    create_restaurant_search_service,
)
from app.services.menu_recommendation import MenuRecommendationService
from app.services.restaurant_search import RestaurantSearchService


def get_menu_service() -> MenuRecommendationService:
    """메뉴 추천 서비스 DI"""
    return create_menu_recommendation_service()


def get_restaurant_service() -> RestaurantSearchService:
    """식당 검색 서비스 DI"""
    return create_restaurant_search_service()
```

#### Task 1.6.3: 라우트
**파일**: `app/api/routes/menu.py`

```python
from fastapi import APIRouter, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.dependencies import get_menu_service
from app.services.menu_recommendation import MenuRecommendationService
from app.schemas.requests.menu import MenuRecommendRequest
from app.schemas.responses.menu import MenuRecommendResponse

router = APIRouter(prefix="/api/menu", tags=["menu"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/recommend", response_model=MenuRecommendResponse)
@limiter.limit("10/minute")
async def recommend_menu(
    request: MenuRecommendRequest,
    service: MenuRecommendationService = Depends(get_menu_service),
):
    """메뉴 추천 API"""
    menus = service.recommend(
        excluded_categories=request.excluded_categories,
        limit=request.limit,
    )
    return MenuRecommendResponse.create(menus)
```

#### Task 1.6.4: main.py 수정
**파일**: `app/main.py`

```python
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import menu, health
from app.core.config import Settings

logging.basicConfig(level=logging.INFO)

settings = Settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
)

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
app.include_router(health.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

#### 체크리스트
- [ ] Pydantic 스키마 작성
- [ ] 의존성 주입 설정
- [ ] API 라우트 구현
- [ ] main.py 업데이트
- [ ] API 문서 확인 (/docs)

---

### 1.7 테스트 작성

#### 테스트 구조
```
tests/
├── conftest.py
├── unit/
│   ├── test_entities.py
│   ├── test_basic_recommender.py
│   └── test_services.py
└── integration/
    └── test_api_menu.py
```

#### Task 1.7.1: conftest.py
**파일**: `tests/conftest.py`

```python
import pytest
from app.infrastructure.repositories.in_memory.menu import InMemoryMenuRepository
from app.infrastructure.adapters.recommender.basic import BasicRecommender
from app.services.menu_recommendation import MenuRecommendationService


@pytest.fixture
def menu_repository():
    return InMemoryMenuRepository()


@pytest.fixture
def basic_recommender(menu_repository):
    return BasicRecommender(menu_repository)


@pytest.fixture
def menu_service(basic_recommender):
    return MenuRecommendationService(basic_recommender)
```

#### Task 1.7.2: 단위 테스트
**파일**: `tests/unit/test_basic_recommender.py`

```python
def test_basic_recommender_returns_menus(basic_recommender):
    from app.domain.value_objects.recommendation_context import RecommendationContext
    from datetime import datetime
    
    context = RecommendationContext(timestamp=datetime.now())
    menus = basic_recommender.recommend(context, limit=3)
    
    assert len(menus) == 3
    assert all(m.name for m in menus)


def test_exclude_categories(basic_recommender):
    from app.domain.value_objects.recommendation_context import RecommendationContext
    from datetime import datetime
    
    context = RecommendationContext(
        timestamp=datetime.now(),
        excluded_categories=["korean"]
    )
    menus = basic_recommender.recommend(context)
    
    assert all(m.category != "korean" for m in menus)
```

#### Task 1.7.3: 통합 테스트
**파일**: `tests/integration/test_api_menu.py`

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_recommend_menu_api():
    response = client.post(
        "/api/menu/recommend",
        json={"limit": 3}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 3


def test_recommend_with_exclusion():
    response = client.post(
        "/api/menu/recommend",
        json={
            "excluded_categories": ["korean"],
            "limit": 5
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert all(item["category"] != "korean" for item in data["data"])
```

#### 체크리스트
- [ ] Fixture 작성
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] 커버리지 80% 이상

---

### 1.8 개발 환경 설정

#### Task 1.8.1: requirements.txt 업데이트
```txt
# Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Database
sqlalchemy==2.0.25
alembic==1.13.1
psycopg2-binary==2.9.9  # PostgreSQL

# Validation & Settings
pydantic==2.5.3
pydantic-settings==2.1.0

# Rate Limiting
slowapi==0.1.9

# HTTP Client (Phase 2+)
httpx==0.26.0

# Testing
pytest==7.4.4
pytest-asyncio==0.23.3
pytest-cov==4.1.0

# Linting & Formatting
ruff==0.1.14
mypy==1.8.0
```

#### Task 1.8.2: pyproject.toml
```toml
[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W"]
ignore = ["E501"]

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true

[[tool.mypy.overrides]]
module = "slowapi.*"
ignore_missing_imports = true

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_classes = "Test*"
python_functions = "test_*"
```

#### Task 1.8.3: .env.example
```bash
# App
APP_NAME=Omechoo
DEBUG=true

# Database
DATABASE_URL=postgresql://user:password@localhost/omechoo

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=10

# Phase 2+ (Future)
WEATHER_API_ENABLED=false
WEATHER_API_KEY=
```

#### 체크리스트
- [ ] requirements.txt 작성
- [ ] pyproject.toml 작성
- [ ] .env.example 작성
- [ ] .gitignore 업데이트

---

## 🚀 Phase 1 실행 계획

### Week 1: 구조 및 Domain/Infrastructure
1. **Day 1-2**: 프로젝트 구조 재구성
2. **Day 3-4**: Domain Layer (엔티티, 인터페이스)
3. **Day 5-7**: Infrastructure Layer (Repository, 기본 추천)

### Week 2: Service/API 및 테스트
1. **Day 8-9**: Service Layer
2. **Day 10-11**: API Layer & 스키마
3. **Day 12-13**: 테스트 작성
4. **Day 14**: 통합 테스트 및 문서화

---

## 📊 완료 기준

### Phase 1 완료 체크리스트
- [ ] 모든 파일 구조 생성 완료
- [ ] Clean Architecture 레이어 분리 완료
- [ ] 메뉴 추천 API 동작 (`POST /api/menu/recommend`)
- [ ] 식당 검색 API 동작 (`POST /api/restaurant/search`)
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] 통합 테스트 통과
- [ ] API 문서 자동 생성 확인 (`/docs`)
- [ ] 타입 체크 통과 (`mypy app/`)
- [ ] 린팅 통과 (`ruff check app/`)

---

## 🔄 다음 단계 (Phase 2)

Phase 1 완료 후:
1. 날씨 API 어댑터 추가 (`WeatherProvider` 인터페이스)
2. 날씨 기반 추천 전략 (`WeatherBasedRecommender`)
3. 기존 코드 수정 없이 확장 가능한지 검증

---

**이 계획으로 진행하시겠습니까? 수정이 필요한 부분이 있으면 말씀해주세요!**
