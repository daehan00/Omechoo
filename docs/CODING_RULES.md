# Omechoo 코딩 규칙 (Quick Reference)

> 전체 아키텍처는 [ARCHITECTURE.md](./ARCHITECTURE.md) 참조

## 핵심 원칙 3가지

1. **추상화에 의존** - 구체 클래스가 아닌 인터페이스(ABC)에 의존
2. **단일 책임** - 하나의 클래스는 하나의 일만
3. **외부 API는 어댑터로 격리** - 비즈니스 로직이 외부 API를 직접 호출하지 않음

---

## 파일 위치 규칙

| 작성할 코드 | 위치 |
|------------|------|
| 추상 인터페이스 (ABC) | `domain/interfaces/` |
| 도메인 엔티티 | `domain/entities/` |
| 비즈니스 로직 | `services/` |
| 외부 API 어댑터 | `infrastructure/adapters/{api명}/` |
| DB 레포지토리 | `infrastructure/repositories/` |
| API 라우트 | `api/routes/` |
| Pydantic DTO | `schemas/requests/`, `schemas/responses/` |

---

## 코드 스타일

```python
# ✅ 타입 힌트 필수
def recommend(self, context: RecommendationContext) -> list[Menu]: ...

# ✅ Optional 대신 | None
def get_weather(self, loc: Location) -> Weather | None: ...

# ✅ private 멤버는 _ prefix
self._client = client

# ✅ Google 스타일 docstring
def foo(self, x: int) -> str:
    """한 줄 설명.
    
    Args:
        x: 설명
        
    Returns:
        설명
    """
```

---

## 새 기능 추가 패턴

### 외부 API 추가 시
```python
# 1. domain/interfaces/weather.py
class WeatherProvider(ABC):
    @abstractmethod
    async def get_current_weather(self, location: Location) -> Weather: ...

# 2. infrastructure/adapters/weather/openweathermap.py
class OpenWeatherMapAdapter(WeatherProvider):
    async def get_current_weather(self, location: Location) -> Weather:
        # 구현
```

### 추천 전략 추가 시
```python
# infrastructure/adapters/recommender/weather_based.py
class WeatherBasedRecommender(RecommendationStrategy):
    def __init__(self, weather_provider: WeatherProvider):
        self._weather = weather_provider
    
    def recommend(self, context: RecommendationContext) -> list[Menu]:
        # 구현
```

---

## 예외 처리

```python
from app.core.exceptions import ExternalAPIError

# 외부 API 호출 시
try:
    response = await self._client.get(url)
    response.raise_for_status()
except httpx.HTTPError as e:
    raise ExternalAPIError("OpenWeatherMap", str(e)) from e
```

---

## 의존성 주입

```python
# api/dependencies.py
def get_weather_provider(
    settings: Settings = Depends(get_settings)
) -> WeatherProvider | None:
    if not settings.WEATHER_API_ENABLED:
        return None
    return OpenWeatherMapAdapter(settings.WEATHER_API_KEY)

# 라우트에서 사용
@router.post("/recommend")
async def recommend(
    service: MenuRecommendationService = Depends(get_recommendation_service),
): ...
```

---

## 인터페이스 변경 시 (중요!)

### 원칙: 확장 우선, 변경 최소화

```python
# ✅ 선택적 파라미터로 확장 (하위 호환)
class WeatherProvider(ABC):
    @abstractmethod
    def get_weather(
        self,
        location: Location,
        units: str = "metric",  # 기본값 제공
    ) -> Weather: ...

# ✅ 새 메서드 추가 (기본 구현)
class WeatherProvider(ABC):
    @abstractmethod
    def get_weather(self, location: Location) -> Weather: ...
    
    def get_forecast(self, location: Location) -> list[Weather]:
        raise NotImplementedError("Not supported")

# ❌ 기존 메서드 시그니처 변경 (모든 구현체 깨짐)
class WeatherProvider(ABC):
    @abstractmethod
    def get_weather(self, location: Location, units: str) -> Weather: ...
```

### 불가피한 변경 시

1. **버전별 인터페이스 생성** (`WeatherProviderV2`)
2. 기존 인터페이스에 `@deprecated` 주석
3. 어댑터로 V1 -> V2 변환 제공
4. 모든 구현체 수정
5. 마이그레이션 문서 작성

> 자세한 내용: [ARCHITECTURE.md - 섹션 11](./ARCHITECTURE.md#11-인터페이스-변경-가이드)

---

## 체크리스트

### 새 파일 작성 전
- [ ] 적절한 디렉토리에 위치하는가?
- [ ] 추상화(인터페이스)가 필요한가?
- [ ] 기존 인터페이스를 구현하는 것인가?

### 인터페이스 수정 전 ⚠️
- [ ] 확장으로 해결 가능한가?
- [ ] 모든 구현체 위치를 파악했는가?
- [ ] 하위 호환성을 유지하는가?

### 코드 작성 후
- [ ] 타입 힌트가 있는가?
- [ ] 외부 의존성이 인터페이스로 주입되는가?
- [ ] 예외 처리가 적절한가?
