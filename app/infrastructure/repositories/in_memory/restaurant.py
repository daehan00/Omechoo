from app.domain.interfaces.repository import RestaurantRepository
from app.domain.entities.restaurant import Restaurant, Location


class InMemoryRestaurantRepository(RestaurantRepository):
    """테스트/개발용 In-Memory 식당 저장소"""
    
    def __init__(self):
        self._restaurants = [
            Restaurant(
                id="r1", name="김가네", category="분식",
                location=Location(37.5, 127.0, "서울시 강남구"),
                urls=["https://kimgane.com"],
                menu_items=["김밥", "떡볶이", "라면"]
            ),
            Restaurant(
                id="r2", name="홍콩반점", category="중식",
                location=Location(37.51, 127.01, "서울시 서초구"),
                menu_items=["짜장면", "짬뽕", "탕수육"]
            )
        ]

    def search_by_menu(self, menu_name: str) -> list[Restaurant]:
        """메뉴 이름이 포함된 식당 검색 (단순 구현)"""
        return [
            r for r in self._restaurants
            if r.menu_items and any(menu_name in item for item in r.menu_items)
        ]
    
    def get_by_id(self, restaurant_id: str) -> Restaurant | None:
        return next((r for r in self._restaurants if r.id == restaurant_id), None)
