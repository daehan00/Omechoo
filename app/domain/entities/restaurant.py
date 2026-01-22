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
    
    # 웹사이트/지도 링크 등
    urls: list[str] | None = None
    
    # 메뉴 목록 (간단히 문자열 리스트로 관리)
    menu_items: list[str] | None = None
