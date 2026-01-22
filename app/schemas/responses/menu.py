from pydantic import BaseModel
from datetime import datetime


class MenuResponse(BaseModel):
    """메뉴 응답"""

    id: str
    name: str
    category: str
    description: str | None = None
    
    # --- 기본 속성 ---
    is_hot: bool | None = None
    is_soup: bool | None = None
    is_noodle: bool | None = None
    is_rice: bool | None = None
    is_bread: bool | None = None
    
    # --- 맛 ---
    is_spicy: bool | None = None
    is_sweet: bool | None = None
    is_salty: bool | None = None
    is_sour: bool | None = None
    is_bitter: bool | None = None
    is_greasy: bool | None = None

    # --- 식감 ---
    is_crispy: bool | None = None
    is_chewy: bool | None = None
    is_soft: bool | None = None

    # --- 재료 ---
    is_meat: bool | None = None
    is_seafood: bool | None = None
    is_vegetable: bool | None = None

    # --- 상황 ---
    is_breakfast: bool | None = None
    is_lunch: bool | None = None
    is_dinner: bool | None = None
    is_snack: bool | None = None
    is_late_night: bool | None = None
    is_hangover: bool | None = None
    is_alcohol_pairing: bool | None = None

    # --- 건강 ---
    is_vegan: bool | None = None
    is_vegetarian: bool | None = None
    is_high_protein: bool | None = None
    is_low_carb: bool | None = None
    is_light: bool | None = None

    # --- 기타 ---
    is_seasonal: bool | None = None
    is_popular: bool | None = None


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
                    # 엔티티의 모든 속성을 동적으로 매핑
                    **{
                        k: v for k, v in m.__dict__.items() 
                        if k in MenuResponse.model_fields and v is not None
                    }
                )
                for m in menus
            ],
            meta={
                "timestamp": datetime.now().isoformat(),
                "count": len(menus),
            }
        )
