from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class MenuDetail:
    name: str
    price: str

@dataclass
class RestaurantDetail:
    """식당 상세 정보 도메인 엔티티"""
    rating: str
    review_count: str
    blog_review_count: str
    business_status: list[str]
    menus: list[MenuDetail] = field(default_factory=list)
    source: str = "unknown"
    updated_at: datetime | None = None
