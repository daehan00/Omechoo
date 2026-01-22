import csv
from pathlib import Path
from typing import List, Optional

from app.domain.interfaces.repository import MenuRepository
from app.domain.entities.menu import Menu, MenuCategory


class InMemoryMenuRepository(MenuRepository):
    """CSV 기반 In-Memory 메뉴 저장소"""

    def __init__(self):
        self._menus: List[Menu] = []
        csv_path = "menu.csv"
        self._load_from_csv(csv_path)

    def _load_from_csv(self, csv_path: str | Path) -> None:
        csv_path = Path(__file__).parent / Path(csv_path)

        with csv_path.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                self._menus.append(self._row_to_menu(row))

    def _row_to_menu(self, row: dict) -> Menu:
        def to_bool(value: str) -> Optional[bool]:
            if value == "" or value is None:
                return None
            return value.lower() == "true"

        def to_list(value: str) -> list[str]:
            return value.split("|") if value else []

        return Menu(
            id=row["id"],
            name=row["name"],
            category=MenuCategory[row["category"]],
            description=row.get("description") or None,

            search_keywords=to_list(row.get("search_keywords", "")),

            is_hot=to_bool(row.get("is_hot", "")),
            is_soup=to_bool(row.get("is_soup", "")),
            is_noodle=to_bool(row.get("is_noodle", "")),
            is_rice=to_bool(row.get("is_rice", "")),
            is_bread=to_bool(row.get("is_bread", "")),

            is_spicy=to_bool(row.get("is_spicy", "")),
            is_sweet=to_bool(row.get("is_sweet", "")),
            is_salty=to_bool(row.get("is_salty", "")),
            is_sour=to_bool(row.get("is_sour", "")),
            is_bitter=to_bool(row.get("is_bitter", "")),
            is_greasy=to_bool(row.get("is_greasy", "")),

            is_crispy=to_bool(row.get("is_crispy", "")),
            is_chewy=to_bool(row.get("is_chewy", "")),
            is_soft=to_bool(row.get("is_soft", "")),

            is_meat=to_bool(row.get("is_meat", "")),
            is_seafood=to_bool(row.get("is_seafood", "")),
            is_vegetable=to_bool(row.get("is_vegetable", "")),

            is_breakfast=to_bool(row.get("is_breakfast", "")),
            is_lunch=to_bool(row.get("is_lunch", "")),
            is_dinner=to_bool(row.get("is_dinner", "")),
            is_snack=to_bool(row.get("is_snack", "")),
            is_late_night=to_bool(row.get("is_late_night", "")),
            is_hangover=to_bool(row.get("is_hangover", "")),
            is_alcohol_pairing=to_bool(row.get("is_alcohol_pairing", "")),

            is_vegan=to_bool(row.get("is_vegan", "")),
            is_vegetarian=to_bool(row.get("is_vegetarian", "")),
            is_high_protein=to_bool(row.get("is_high_protein", "")),
            is_low_carb=to_bool(row.get("is_low_carb", "")),
            is_light=to_bool(row.get("is_light", "")),

            is_seasonal=to_bool(row.get("is_seasonal", "")),
            is_popular=to_bool(row.get("is_popular", "")),
        )

    # --- Repository Interface ---

    def get_all(self) -> list[Menu]:
        return self._menus.copy()

    def get_by_id(self, menu_id: str) -> Menu | None:
        return next((m for m in self._menus if m.id == menu_id), None)

    def get_by_category(self, category: MenuCategory) -> list[Menu]:
        return [m for m in self._menus if m.category == category]
