from typing import Any
from pydantic import BaseModel, Field


class MenuRecommendRequest(BaseModel):
    """메뉴 추천 요청"""
    
    included_categories: list[str] | None = Field(
        None,
        description="포함할 카테고리 목록 (없으면 전체)",
        examples=["korean", "western"]
    )
    excluded_categories: list[str] | None = Field(
        None,
        description="제외할 카테고리 목록",
        examples=["japanese"]
    )
    attributes: dict[str, Any] | None = Field(
        None,
        description="메뉴 속성 필터 (예: {'main_base': 'rice', 'spiciness': 2})",
        examples=[{"main_base": "rice", "spiciness": 2}]
    )
    limit: int = Field(
        default=5,
        ge=1,
        le=10,
        description="추천 개수 (1-10)"
    )
