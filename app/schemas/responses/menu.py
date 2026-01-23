from typing import Any
from pydantic import BaseModel


class MenuResponse(BaseModel):
    """메뉴 응답"""
    model_config = {"from_attributes": True}

    id: str
    name: str
    category: str
    description: str | None = None
    
    # --- 핵심 속성 ---
    main_base: str | None = None
    spiciness: int | None = None
    temperature: str | None = None
    heaviness: int | None = None
    
    # --- 태그 및 기타 ---
    tags: set[str] | list[str] | None = None
    search_keywords: list[str] | None = None


class MenuRecommendResponse(BaseModel):
    """메뉴 추천 응답"""
    success: bool = True
    data: list[MenuResponse]
    meta: dict
    
    @staticmethod
    def create(menus: list) -> "MenuRecommendResponse":
        from datetime import datetime
        return MenuRecommendResponse(
            data=[
                MenuResponse(
                    # 엔티티의 Enum 값들을 문자열/정수로 변환하여 매핑
                    id=m.id,
                    name=m.name,
                    category=m.category.value if hasattr(m.category, "value") else m.category,
                    description=m.description,
                    main_base=m.main_base.value if hasattr(m.main_base, "value") else m.main_base,
                    spiciness=m.spiciness.value if hasattr(m.spiciness, "value") else m.spiciness,
                    temperature=m.temperature.value if hasattr(m.temperature, "value") else m.temperature,
                    heaviness=m.heaviness.value if hasattr(m.heaviness, "value") else m.heaviness,
                    tags=m.tags,
                    search_keywords=m.search_keywords
                )
                for m in menus
            ],
            meta={
                "timestamp": datetime.now().isoformat(),
                "count": len(menus),
            }
        )