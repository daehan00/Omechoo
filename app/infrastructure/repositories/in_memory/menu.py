import csv
import os
from pathlib import Path
from app.domain.interfaces.repository import MenuRepository
from app.domain.entities.menu import (
    Menu, MenuCategory, MainBase, Spiciness, Temperature, Heaviness, MealTime
)


class InMemoryMenuRepository(MenuRepository):
    """테스트/개발용 In-Memory 메뉴 저장소 (CSV 기반)"""
    
    def __init__(self):
        self._menus = self._load_from_csv()
    
    def _load_from_csv(self) -> list[Menu]:
        menus = []
        # 현재 파일의 디렉토리 경로 구하기
        current_dir = Path(__file__).parent
        csv_path = current_dir / "menu.csv"
        
        if not csv_path.exists():
            return []

        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    menus.append(self._parse_row(row))
                except Exception as e:
                    print(f"Error parsing row {row['id']}: {e}")
                    continue
        return menus

    def _parse_row(self, row: dict) -> Menu:
        # 1. 기본 필드
        menu_id = row['id']
        name = row['name']
        category = MenuCategory(row['category'])
        description = row['description'] if row['description'] else None
        
        # 2. 리스트/세트 파싱 (| 구분자)
        search_keywords = row['search_keywords'].split('|') if row['search_keywords'] else []
        
        available_times_str = row['available_times'].split('|') if row['available_times'] else []
        available_times = {MealTime(t.strip()) for t in available_times_str if t.strip()}
        
        tags = set(row['tags'].split('|')) if row['tags'] else set()
        
        # 3. Enum/IntEnum 파싱
        main_base = MainBase(row['main_base'])
        spiciness = Spiciness(int(row['spiciness']))
        temperature = Temperature(row['temperature'])
        heaviness = Heaviness(int(row['heaviness']))
        
        return Menu(
            id=menu_id,
            name=name,
            category=category,
            description=description,
            search_keywords=search_keywords,
            main_base=main_base,
            spiciness=spiciness,
            temperature=temperature,
            heaviness=heaviness,
            available_times=available_times,
            tags=tags
        )
    
    def get_all(self) -> list[Menu]:
        return self._menus.copy()
    
    def get_by_category(self, category: MenuCategory) -> list[Menu]:
        return [m for m in self._menus if m.category == category]
    
    def get_by_id(self, menu_id: str) -> Menu | None:
        return next((m for m in self._menus if m.id == menu_id), None)