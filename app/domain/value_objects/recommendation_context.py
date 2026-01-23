from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class RecommendationContext:
    """추천 컨텍스트 (추천 시 필요한 모든 정보)"""
    
    # 필수 정보
    timestamp: datetime
    
    # 선택적 정보
    included_categories: list[str] | None = None
    excluded_categories: list[str] | None = None
    user_id: str | None = None  # 향후 개인화용
    
    # 메뉴 속성 필터 (예: {"spiciness": 2, "main_base": "rice"})
    attributes: dict[str, Any] = field(default_factory=dict)
    
    # 향후 확장 (Phase 2, 3)
    weather: str | None = None
    location: tuple[float, float] | None = None
