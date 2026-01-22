# 🍽️ Omechoo 백엔드 아키텍처 가이드

## 1. 아키텍처 개요

### 1.1 핵심 설계 철학
```
"특정 API나 라이브러리에 종속되지 않으면서, 새로운 기능을 쉽게 추가할 수 있는 구조"
```

### 1.2 레이어드 아키텍처 (Clean Architecture 기반)
```
┌─────────────────────────────────────────────────────┐
│                    API Layer                        │
│              (FastAPI Routes/Controllers)           │
├─────────────────────────────────────────────────────┤
│                  Service Layer                      │
│         (비즈니스 로직 - Use Cases)                   │
├─────────────────────────────────────────────────────┤
│                  Domain Layer                       │
│    (엔티티, 인터페이스/추상 클래스, 비즈니스 규칙)        │
├─────────────────────────────────────────────────────┤
│               Infrastructure Layer                  │
│   (외부 API 어댑터, DB, 캐시, 외부 서비스 구현체)        │
└─────────────────────────────────────────────────────┘
```

---

## 2. SOLID 원칙 적용

### 2.1 Single Responsibility Principle (단일 책임 원칙)
- 각 클래스/모듈은 하나의 책임만 가진다
- **예시**: `MenuRecommender`는 메뉴 추천만, `RestaurantLocator`는 식당 검색만

```python
# ✅ Good
class MenuRecommender:
    """메뉴 추천에 대한 책임만 가짐"""
    def recommend(self, context: RecommendationContext) -> list[Menu]: ...

class RestaurantLocator:
    """식당 검색에 대한 책임만 가짐"""
    def search(self, menu: Menu, location: Location) -> list[Restaurant]: ...

# ❌ Bad
class MenuService:
    def recommend_menu(self): ...
    def search_restaurant(self): ...
    def analyze_reviews(self): ...
    def get_weather(self): ...
```

### 2.2 Open/Closed Principle (개방-폐쇄 원칙)
- 확장에는 열려있고, 수정에는 닫혀있어야 함
- 새로운 추천 전략, 외부 API 추가 시 기존 코드 수정 없이 확장 가능

```python
# 추상 인터페이스 정의
class RecommendationStrategy(ABC):
    @abstractmethod
    def recommend(self, context: RecommendationContext) -> list[Menu]: ...

# 새 전략 추가 시 기존 코드 수정 없이 클래스만 추가
class BasicRecommender(RecommendationStrategy): ...
class WeatherBasedRecommender(RecommendationStrategy): ...  # 확장
class AIBasedRecommender(RecommendationStrategy): ...       # 확장
```

### 2.3 Liskov Substitution Principle (리스코프 치환 원칙)
- 하위 클래스는 상위 클래스를 완전히 대체할 수 있어야 함
- 모든 구현체는 인터페이스의 계약을 준수

### 2.4 Interface Segregation Principle (인터페이스 분리 원칙)
- 클라이언트별로 필요한 인터페이스만 의존

```python
# ✅ Good - 분리된 인터페이스
class WeatherProvider(ABC):
    @abstractmethod
    def get_current_weather(self, location: Location) -> Weather: ...

class MapProvider(ABC):
    @abstractmethod
    def get_nearby_places(self, location: Location, radius: float) -> list[Place]: ...

# ❌ Bad - 뚱뚱한 인터페이스
class ExternalAPIProvider(ABC):
    def get_weather(self): ...
    def get_map(self): ...
    def get_reviews(self): ...
```

### 2.5 Dependency Inversion Principle (의존성 역전 원칙)
- 고수준 모듈이 저수준 모듈에 의존하지 않음
- 둘 다 추상화(인터페이스)에 의존

```python
# Service Layer는 추상화에만 의존
class MenuRecommendationService:
    def __init__(
        self,
        recommender: RecommendationStrategy,      # 추상화
        weather_provider: WeatherProvider | None, # 추상화 (선택적)
    ):
        self._recommender = recommender
        self._weather_provider = weather_provider
```

---

## 3. 핵심 설계 패턴

### 3.1 Strategy Pattern (추천 알고리즘)
```python
# 다양한 추천 전략을 런타임에 교체 가능
strategies = {
    "basic": BasicRecommender(),
    "weather": WeatherBasedRecommender(weather_provider),
    "ai": AIRecommender(ai_client),
}
```

### 3.2 Adapter Pattern (외부 API 격리)
```python
# 외부 API 변경이 비즈니스 로직에 영향을 주지 않음
class OpenWeatherMapAdapter(WeatherProvider):
    """OpenWeatherMap API를 WeatherProvider 인터페이스로 변환"""
    def get_current_weather(self, location: Location) -> Weather:
        raw_data = self._client.fetch(location.lat, location.lon)
        return Weather(
            temperature=raw_data["main"]["temp"],
            condition=self._map_condition(raw_data["weather"][0]["main"])
        )

class AccuWeatherAdapter(WeatherProvider):
    """AccuWeather API도 동일한 인터페이스로 제공"""
    ...
```

### 3.3 Repository Pattern (데이터 접근 추상화)
```python
class MenuRepository(ABC):
    @abstractmethod
    def get_by_id(self, menu_id: str) -> Menu | None: ...
    
    @abstractmethod
    def get_by_category(self, category: str) -> list[Menu]: ...

class SQLAlchemyMenuRepository(MenuRepository):
    """SQLAlchemy 구현체"""
    ...

class InMemoryMenuRepository(MenuRepository):
    """테스트용 인메모리 구현체"""
    ...
```

### 3.4 Factory Pattern (의존성 조립)
```python
# app/core/factories.py
def create_recommendation_service(settings: Settings) -> MenuRecommendationService:
    """설정에 따라 적절한 구현체 조립"""
    weather_provider = None
    if settings.WEATHER_API_ENABLED:
        weather_provider = OpenWeatherMapAdapter(settings.WEATHER_API_KEY)
    
    return MenuRecommendationService(
        recommender=BasicRecommender(),
        weather_provider=weather_provider,
    )
```

---

## 4. 프로젝트 구조

```
app/
├── main.py                     # FastAPI 앱 엔트리포인트
├── core/
│   ├── config.py               # 환경 설정 (Pydantic Settings)
│   ├── exceptions.py           # 커스텀 예외 정의
│   ├── factories.py            # 의존성 팩토리
│   └── logging.py              # 로깅 설정
│
├── domain/                     # ★ 핵심 도메인 (외부 의존성 없음)
│   ├── entities/               # 도메인 엔티티
│   │   ├── menu.py
│   │   ├── restaurant.py
│   │   └── location.py
│   ├── interfaces/             # 추상 인터페이스 (포트)
│   │   ├── recommender.py      # RecommendationStrategy ABC
│   │   ├── locator.py          # RestaurantLocator ABC
│   │   ├── weather.py          # WeatherProvider ABC
│   │   ├── map.py              # MapProvider ABC
│   │   └── repository.py       # Repository ABCs
│   └── value_objects/          # 값 객체
│       └── recommendation_context.py
│
├── services/                   # 비즈니스 로직 (유스케이스)
│   ├── menu_recommendation.py
│   └── restaurant_search.py
│
├── infrastructure/             # 외부 의존성 구현체 (어댑터)
│   ├── adapters/
│   │   ├── weather/
│   │   │   ├── openweathermap.py
│   │   │   └── mock.py         # 테스트/개발용
│   │   ├── map/
│   │   │   ├── kakao.py
│   │   │   ├── naver.py
│   │   │   └── mock.py
│   │   └── ai/
│   │       └── openai.py
│   └── repositories/
│       ├── sqlalchemy/
│       │   ├── menu.py
│       │   └── restaurant.py
│       └── in_memory/          # 테스트용
│
├── api/
│   ├── dependencies.py         # FastAPI Depends 정의
│   ├── routes/
│   │   ├── menu.py             # /api/menu/*
│   │   ├── restaurant.py       # /api/restaurant/*
│   │   └── health.py           # 헬스체크
│   └── middleware/
│       └── rate_limit.py
│
├── models/                     # SQLAlchemy ORM 모델
│   ├── menu.py
│   └── restaurant.py
│
└── schemas/                    # Pydantic DTO
    ├── requests/
    │   ├── menu.py
    │   └── restaurant.py
    └── responses/
        ├── menu.py
        └── restaurant.py
```

---

## 5. 의존성 주입 (FastAPI Depends)

```python
# app/api/dependencies.py
from functools import lru_cache
from fastapi import Depends

@lru_cache
def get_settings() -> Settings:
    return Settings()

def get_weather_provider(
    settings: Settings = Depends(get_settings)
) -> WeatherProvider | None:
    if not settings.WEATHER_API_ENABLED:
        return None
    return OpenWeatherMapAdapter(settings.WEATHER_API_KEY)

def get_recommendation_service(
    weather_provider: WeatherProvider | None = Depends(get_weather_provider),
) -> MenuRecommendationService:
    return MenuRecommendationService(
        recommender=BasicRecommender(),
        weather_provider=weather_provider,
    )

# 라우트에서 사용
@router.post("/recommend")
async def recommend_menu(
    request: RecommendRequest,
    service: MenuRecommendationService = Depends(get_recommendation_service),
):
    return service.recommend(request.to_context())
```

---

## 6. 코드 스타일 가이드

### 6.1 일반 규칙
- **Python 버전**: 3.11+
- **포매터**: `ruff format` (Black 호환)
- **린터**: `ruff check`
- **타입 체커**: `mypy --strict`

### 6.2 네이밍 컨벤션
| 대상 | 스타일 | 예시 |
|------|--------|------|
| 클래스 | PascalCase | `MenuRecommender`, `WeatherProvider` |
| 함수/메서드 | snake_case | `get_recommendations()`, `search_nearby()` |
| 상수 | UPPER_SNAKE | `DEFAULT_RADIUS`, `MAX_RESULTS` |
| private 멤버 | _prefix | `self._client`, `def _validate():` |
| 인터페이스/ABC | 명사 또는 Provider/Strategy 접미사 | `WeatherProvider`, `RecommendationStrategy` |
| 어댑터 | {서비스명}Adapter | `OpenWeatherMapAdapter`, `KakaoMapAdapter` |

### 6.3 타입 힌트 (필수)
```python
# ✅ 모든 함수에 타입 힌트 필수
def recommend_menu(
    self,
    context: RecommendationContext,
    limit: int = 5,
) -> list[Menu]:
    ...

# ✅ Optional 대신 | None 사용 (Python 3.10+)
def get_weather(self, location: Location) -> Weather | None:
    ...

# ✅ 컬렉션 타입은 구체적으로
menus: list[Menu]
menu_map: dict[str, Menu]
```

### 6.4 Docstring (Google 스타일)
```python
def recommend_menu(
    self,
    context: RecommendationContext,
    strategies: list[str] | None = None,
) -> list[Menu]:
    """사용자 컨텍스트를 기반으로 메뉴를 추천합니다.
    
    Args:
        context: 사용자의 선호도, 위치, 시간 등 추천에 필요한 정보
        strategies: 사용할 추천 전략 목록. None이면 기본 전략 사용
        
    Returns:
        추천된 메뉴 목록 (최대 5개)
        
    Raises:
        RecommendationError: 추천 과정에서 오류 발생 시
    """
```

### 6.5 예외 처리
```python
# app/core/exceptions.py
class OmechooError(Exception):
    """Base exception for all application errors"""
    pass

class RecommendationError(OmechooError):
    """추천 관련 오류"""
    pass

class ExternalAPIError(OmechooError):
    """외부 API 호출 오류"""
    def __init__(self, provider: str, message: str):
        self.provider = provider
        super().__init__(f"[{provider}] {message}")

# 사용 예시
class OpenWeatherMapAdapter(WeatherProvider):
    def get_current_weather(self, location: Location) -> Weather:
        try:
            response = self._client.get(...)
            response.raise_for_status()
            return self._parse_response(response.json())
        except httpx.HTTPError as e:
            raise ExternalAPIError("OpenWeatherMap", str(e)) from e
```

### 6.6 비동기 처리
```python
# I/O 바운드 작업은 async 사용
class AsyncWeatherProvider(ABC):
    @abstractmethod
    async def get_current_weather(self, location: Location) -> Weather: ...

class OpenWeatherMapAdapter(AsyncWeatherProvider):
    async def get_current_weather(self, location: Location) -> Weather:
        async with httpx.AsyncClient() as client:
            response = await client.get(...)
            return self._parse(response.json())
```

---

## 7. 테스트 전략

### 7.1 테스트 구조
```
tests/
├── conftest.py                 # 공통 Fixture
├── unit/
│   ├── domain/
│   │   └── test_entities.py
│   ├── services/
│   │   └── test_recommendation.py
│   └── infrastructure/
│       └── adapters/
├── integration/
│   ├── test_api_menu.py
│   └── test_api_restaurant.py
└── fixtures/
    └── mock_adapters.py
```

### 7.2 Mock 어댑터 활용
```python
# tests/fixtures/mock_adapters.py
class MockWeatherProvider(WeatherProvider):
    def __init__(self, weather: Weather):
        self._weather = weather
    
    def get_current_weather(self, location: Location) -> Weather:
        return self._weather

# 테스트에서 사용
def test_weather_based_recommendation():
    mock_weather = MockWeatherProvider(Weather(temperature=35, condition="hot"))
    service = MenuRecommendationService(
        recommender=WeatherBasedRecommender(mock_weather),
        weather_provider=mock_weather,
    )
    
    result = service.recommend(context)
    assert any(menu.category == "냉면" for menu in result)
```

---

## 8. 설정 관리

```python
# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 앱 설정
    APP_NAME: str = "omechoo"
    DEBUG: bool = False
    
    # 데이터베이스
    DATABASE_URL: str = "sqlite:///./omechoo.db"
    
    # 외부 API (선택적 - 확장 시 추가)
    WEATHER_API_ENABLED: bool = False
    WEATHER_API_KEY: str = ""
    WEATHER_API_PROVIDER: str = "openweathermap"  # openweathermap | accuweather
    
    MAP_API_ENABLED: bool = False
    MAP_API_KEY: str = ""
    MAP_API_PROVIDER: str = "kakao"  # kakao | naver | google
    
    AI_API_ENABLED: bool = False
    AI_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True
```

---

## 9. API 응답 표준

```python
# 성공 응답
{
    "success": true,
    "data": { ... },
    "meta": {
        "timestamp": "2026-01-22T10:30:00Z",
        "request_id": "uuid"
    }
}

# 에러 응답
{
    "success": false,
    "error": {
        "code": "RECOMMENDATION_FAILED",
        "message": "추천을 생성할 수 없습니다",
        "details": { ... }
    },
    "meta": {
        "timestamp": "2026-01-22T10:30:00Z",
        "request_id": "uuid"
    }
}
```

---

## 10. 확장 로드맵

| Phase | 기능 | 필요한 인터페이스 |
|-------|------|------------------|
| 1 | 기본 메뉴 추천 + 식당 검색 | `RecommendationStrategy`, `RestaurantLocator` |
| 2 | 날씨 기반 추천 | `WeatherProvider` |
| 3 | 위치 기반 근처 식당 | `MapProvider` |
| 4 | 리뷰 AI 분석 | `ReviewAnalyzer`, `AIProvider` |
| 5 | 개인화 추천 | `UserPreferenceRepository` |

---

## 11. 인터페이스 변경 가이드

### 11.1 기본 원칙: 하위 호환성 우선

인터페이스는 여러 구현체와 서비스가 의존하는 **계약(Contract)**입니다.
변경 시 모든 구현체를 수정해야 하므로, 가능한 한 **확장(Extension)**을 사용하세요.

```python
# ❌ 기존 인터페이스 변경 (Breaking Change)
class WeatherProvider(ABC):
    @abstractmethod
    def get_current_weather(
        self,
        location: Location,
        units: str,  # ← 새 파라미터 추가 시 기존 구현체 모두 깨짐
    ) -> Weather: ...

# ✅ 선택적 파라미터로 확장 (하위 호환)
class WeatherProvider(ABC):
    @abstractmethod
    def get_current_weather(
        self,
        location: Location,
        units: str = "metric",  # ← 기본값 제공
    ) -> Weather: ...

# ✅ 새 메서드 추가 (하위 호환)
class WeatherProvider(ABC):
    @abstractmethod
    def get_current_weather(self, location: Location) -> Weather: ...
    
    def get_forecast(
        self,
        location: Location,
        days: int = 3,
    ) -> list[Weather]:
        """기본 구현 제공 (Python 3.10+에서는 override 가능)"""
        raise NotImplementedError("Forecast not supported")
```

### 11.2 인터페이스 변경이 불가피한 경우

#### 패턴 1: 버전별 인터페이스 (권장)
```python
# domain/interfaces/weather.py

# V1 (기존) - Deprecated 표시
class WeatherProvider(ABC):
    """@deprecated: Use WeatherProviderV2 for new implementations"""
    @abstractmethod
    def get_current_weather(self, location: Location) -> Weather: ...

# V2 (새 버전)
class WeatherProviderV2(ABC):
    @abstractmethod
    async def get_current_weather(
        self,
        location: Location,
        units: TemperatureUnit = TemperatureUnit.CELSIUS,
    ) -> WeatherData: ...

# 어댑터로 V1 -> V2 변환
class WeatherProviderV1ToV2Adapter(WeatherProviderV2):
    def __init__(self, v1_provider: WeatherProvider):
        self._provider = v1_provider
    
    async def get_current_weather(
        self,
        location: Location,
        units: TemperatureUnit = TemperatureUnit.CELSIUS,
    ) -> WeatherData:
        old_weather = self._provider.get_current_weather(location)
        return self._convert_to_v2(old_weather, units)
```

#### 패턴 2: 단계적 마이그레이션

**Step 1**: 새 인터페이스 정의 및 기존 인터페이스와 병행
```python
# domain/interfaces/recommender.py

# 기존 (유지)
class RecommendationStrategy(ABC):
    @abstractmethod
    def recommend(self, context: RecommendationContext) -> list[Menu]: ...

# 새 버전 추가
class AsyncRecommendationStrategy(ABC):
    @abstractmethod
    async def recommend(
        self,
        context: RecommendationContext,
        filters: MenuFilters | None = None,
    ) -> RecommendationResult:  # 메타데이터 포함
        ...
```

**Step 2**: 새 인터페이스로 서비스 수정 (기존과 병행 지원)
```python
# services/menu_recommendation.py

class MenuRecommendationService:
    def __init__(
        self,
        recommender: RecommendationStrategy | AsyncRecommendationStrategy,
    ):
        self._recommender = recommender
    
    async def recommend(self, context: RecommendationContext) -> list[Menu]:
        # 타입에 따라 분기
        if isinstance(self._recommender, AsyncRecommendationStrategy):
            result = await self._recommender.recommend(context)
            return result.menus
        else:
            return self._recommender.recommend(context)
```

**Step 3**: 모든 구현체를 새 인터페이스로 마이그레이션

**Step 4**: 기존 인터페이스 제거 (메이저 버전 업데이트)

### 11.3 인터페이스 변경 체크리스트

#### 변경 전 검토
- [ ] 기존 인터페이스 확장으로 해결 가능한가?
- [ ] 선택적 파라미터나 기본 구현으로 하위 호환성 유지 가능한가?
- [ ] 모든 구현체 목록 파악 (`grep -r "class.*({인터페이스명})" app/`)
- [ ] 모든 사용처 목록 파악

#### 변경 시 필수 작업
- [ ] 변경 이유 문서화 (CHANGELOG.md)
- [ ] 마이그레이션 가이드 작성
- [ ] Deprecated 경고 추가
- [ ] 모든 구현체 수정 또는 어댑터 작성
- [ ] 모든 테스트 수정
- [ ] 타입 체커 통과 확인 (`mypy app/`)

### 11.4 인터페이스 설계 Best Practices

```python
# ✅ 작고 집중된 인터페이스
class WeatherProvider(ABC):
    @abstractmethod
    def get_current_weather(self, location: Location) -> Weather: ...

class ForecastProvider(ABC):
    @abstractmethod
    def get_forecast(self, location: Location, days: int) -> list[Weather]: ...

# ❌ 거대한 인터페이스 (변경 시 파급 효과 큼)
class WeatherService(ABC):
    @abstractmethod
    def get_current_weather(self, location: Location) -> Weather: ...
    
    @abstractmethod
    def get_forecast(self, location: Location, days: int) -> list[Weather]: ...
    
    @abstractmethod
    def get_historical_data(self, location: Location, date: str) -> Weather: ...
```

---

## 12. 체크리스트

### 새로운 외부 API 추가 시
- [ ] `domain/interfaces/`에 추상 인터페이스 정의
- [ ] `infrastructure/adapters/`에 구현체 작성
- [ ] `core/config.py`에 설정 추가
- [ ] `api/dependencies.py`에 DI 설정
- [ ] Mock 어댑터 작성 (테스트용)
- [ ] 환경변수 문서화

### 새로운 추천 전략 추가 시
- [ ] `RecommendationStrategy` 구현
- [ ] Factory에 전략 등록
- [ ] 단위 테스트 작성
