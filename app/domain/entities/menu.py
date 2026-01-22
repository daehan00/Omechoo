from enum import Enum
from dataclasses import dataclass, field


class MenuCategory(str, Enum):
    """메뉴 카테고리"""
    KOREAN = "korean"
    CHINESE = "chinese"
    JAPANESE = "japanese"
    WESTERN = "western"
    ASIAN = "asian"
    CAFE = "cafe"
    FAST_FOOD = "fast_food"
    FUSION = "fusion"
    BUFFET = "buffet"
    OTHER = "other"


@dataclass
class Menu:
    """메뉴 엔티티"""
    id: str
    name: str
    category: MenuCategory
    description: str | None = None
    
    # --- 검색 및 매핑 정보 ---
    search_keywords: list[str] = field(default_factory=list)  # 예: ["떡볶이", "분식"]

    # --- 기본 속성 (Temperature & Texture) ---
    is_hot: bool | None = None       # True: 뜨거움, False: 차가움
    is_soup: bool | None = None      # 국물 요리 여부
    is_noodle: bool | None = None    # 면 요리 여부
    is_rice: bool | None = None      # 밥 요리 여부
    is_bread: bool | None = None     # 빵/밀가루 중심
    
    # --- 맛 (Taste) ---
    is_spicy: bool | None = None     # 매운맛
    is_sweet: bool | None = None     # 단맛
    is_salty: bool | None = None     # 짠맛
    is_sour: bool | None = None      # 신맛
    is_bitter: bool | None = None    # 쓴맛
    is_greasy: bool | None = None    # 기름진맛

    # --- 식감 (Texture) ---
    is_crispy: bool | None = None    # 바삭한
    is_chewy: bool | None = None     # 쫄깃한
    is_soft: bool | None = None      # 부드러운

    # --- 재료 특성 (Ingredients) ---
    is_meat: bool | None = None      # 고기 포함
    is_seafood: bool | None = None   # 해산물 포함
    is_vegetable: bool | None = None # 채소 위주

    # --- 상황 및 목적 (Context/Occasion) ---
    is_breakfast: bool | None = None # 아침 식사 적합
    is_lunch: bool | None = None     # 점심 식사 적합
    is_dinner: bool | None = None    # 저녁 식사 적합
    is_snack: bool | None = None     # 간식/디저트
    is_late_night: bool | None = None # 야식 추천
    is_hangover: bool | None = None  # 해장 추천
    is_alcohol_pairing: bool | None = None # 안주 추천 (술과 어울림)

    # --- 건강 및 식단 (Dietary) ---
    is_vegan: bool | None = None
    is_vegetarian: bool | None = None
    is_high_protein: bool | None = None
    is_low_carb: bool | None = None
    is_light: bool | None = None     # 가벼운 식사 (다이어트 등)

    # --- 기타 ---
    is_seasonal: bool | None = None  # 계절 메뉴
    is_popular: bool | None = None   # 인기 메뉴
