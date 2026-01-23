from app.domain.value_objects.recommendation_context import RecommendationContext
from datetime import datetime
from app.domain.entities.menu import MenuCategory, MainBase, Spiciness


def test_recommend_limit(basic_recommender):
    """추천 개수 제한 테스트"""
    context = RecommendationContext(timestamp=datetime.now())
    menus = basic_recommender.recommend(context, limit=2)
    assert len(menus) <= 2


def test_filter_included_categories(basic_recommender):
    """카테고리 포함 필터링 테스트"""
    context = RecommendationContext(
        timestamp=datetime.now(),
        included_categories=[MenuCategory.KOREAN.value]
    )
    menus = basic_recommender.recommend(context, limit=10)
    
    assert len(menus) > 0
    assert all(m.category == MenuCategory.KOREAN for m in menus)


def test_filter_excluded_categories(basic_recommender):
    """카테고리 제외 필터링 테스트"""
    context = RecommendationContext(
        timestamp=datetime.now(),
        excluded_categories=[MenuCategory.WESTERN.value]
    )
    menus = basic_recommender.recommend(context, limit=10)
    
    assert len(menus) > 0
    assert all(m.category != MenuCategory.WESTERN for m in menus)


def test_filter_attributes_exact_match(basic_recommender):
    """속성 정확 일치 테스트 (MainBase, Spiciness 등)"""
    # 1. MainBase: NOODLE (매운라면)
    context = RecommendationContext(
        timestamp=datetime.now(),
        attributes={"main_base": MainBase.NOODLE}
    )
    menus = basic_recommender.recommend(context)
    assert len(menus) == 1
    assert menus[0].name == "매운라면"

    # 2. Spiciness: NONE (초밥, 스테이크, 샐러드)
    context = RecommendationContext(
        timestamp=datetime.now(),
        attributes={"spiciness": Spiciness.NONE}
    )
    menus = basic_recommender.recommend(context, limit=10)
    assert len(menus) == 3
    assert all(m.spiciness == Spiciness.NONE for m in menus)


def test_filter_tags(basic_recommender):
    """태그 기반 필터링 테스트"""
    # "SOUP" 태그가 있는 메뉴 찾기
    context = RecommendationContext(
        timestamp=datetime.now(),
        attributes={"SOUP": True}
    )
    menus = basic_recommender.recommend(context)
    
    assert len(menus) > 0
    assert all("SOUP" in m.tags for m in menus)
    assert any(m.name == "매운라면" for m in menus)


def test_complex_filtering(basic_recommender):
    """복합 필터링 테스트 (카테고리 + 속성 + 태그)"""
    # Western 카테고리이면서 LIGHT 한 메뉴 (샐러드)
    context = RecommendationContext(
        timestamp=datetime.now(),
        included_categories=[MenuCategory.WESTERN.value],
        attributes={"DIET": True}
    )
    menus = basic_recommender.recommend(context)
    
    assert len(menus) == 1
    assert menus[0].name == "샐러드"


def test_no_match(basic_recommender):
    """조건에 맞는 메뉴가 없는 경우"""
    context = RecommendationContext(
        timestamp=datetime.now(),
        attributes={"main_base": "impossible_value"}
    )
    menus = basic_recommender.recommend(context)
    assert len(menus) == 0
