from enum import Enum, IntEnum
from dataclasses import dataclass, field
from typing import List, Set, Optional


# 1. [핵심 축 1] 주재료 (Rice vs Noodle) - 가장 강력한 결정 요인
class MainBase(str, Enum):
    """주재료 분류"""
    RICE = "rice"           # 밥 (백반, 볶음밥, 덮밥, 죽)
    NOODLE = "noodle"       # 면 (국수, 파스타, 짜장면)
    BREAD = "bread"         # 빵/밀가루 (피자, 샌드위치, 햄버거)
    MEAT = "meat"           # 고기 중심 (삼겹살, 족발, 치킨) - 밥/면 없이도 성립
    SEAFOOD = "seafood"     # 해산물 중심 (회, 조개구이)
    VEGETABLE = "vegetable" # 채소 중심 (샐러드)
    ETC = "etc"             # 기타 (떡볶이 등 애매한 분식류)


# 2. [핵심 축 2] 정량적 속성 (Scoring을 위해 IntEnum 사용 권장)
class Spiciness(IntEnum):
    """맵기 등급"""
    NONE = 0        # 안 매움 (0점)
    LITTLE = 1      # 진라면 순한맛 (1점)
    MILD = 2        # 신라면 (2점)
    SPICY = 3       # 불닭볶음면 (3점)
    HELL = 4        # 엽떡 매운맛 (4점)


class Temperature(str, Enum):
    """음식 온도"""
    HOT = "hot"      # 찌개, 국밥
    COLD = "cold"    # 냉면, 소바
    NEUTRAL = "neutral" # 초밥, 샌드위치


class Heaviness(IntEnum):
    """음식의 무거움 정도"""
    LIGHT = 1       # 간식, 샐러드
    MEDIUM = 2      # 일반 가정식
    HEAVY = 3       # 고기 구이, 뷔페


# 3. [상황적 집합] 식사 시간 (비트마스크 대신 Set 활용)
class MealTime(str, Enum):
    """추천 식사 시간"""
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    LATE_NIGHT = "late_night" # 야식
    SNACK = "snack" # 간식


# 기존 카테고리 Enum 유지 (표시용 대분류)
class MenuCategory(str, Enum):
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
    """메뉴 도메인 엔티티"""
    id: str
    name: str
    category: MenuCategory  # 표시용 카테고리 (예: "한식", "일식")
    description: str | None = None
    
    # --- [A] 검색용 매핑 (검색 품질의 핵심) ---
    # 실제 지도 API에 던질 키워드들
    search_keywords: List[str] = field(default_factory=list)

    # --- [B] 핵심 속성 (Scoring Axes) ---
    main_base: MainBase = MainBase.ETC
    spiciness: Spiciness = Spiciness.NONE
    temperature: Temperature = Temperature.NEUTRAL
    heaviness: Heaviness = Heaviness.MEDIUM
    
    # --- [C] 식사 시간 (Set으로 관리하여 교집합 확인 용이) ---
    available_times: Set[MealTime] = field(default_factory=set)

    # --- [D] 부가 속성 (Tags) - 필터링 및 가산점용 ---
    # 예: SOUP(국물), GREASY(기름진), HANGOVER(해장), SOLO_EATING(혼밥가능), SEASONAL(계절) 등
    tags: Set[str] = field(default_factory=set)