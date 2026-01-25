import pytest
from app.infrastructure.scrapers.kakao import KakaoRestaurantScraper
from app.domain.entities.restaurant_detail import RestaurantDetail

@pytest.fixture
def scraper():
    return KakaoRestaurantScraper()

def test_parse_body_basic_info(scraper):
    """기본 정보(별점, 후기, 영업상태) 파싱 테스트"""
    html_text = """
    장소명
    신현무관
    별점
    4.0
    후기
    23
    블로그
    13
    영업 마감내일 10:50 오픈
    """
    
    result = scraper.parse_body(html_text)
    
    assert isinstance(result, RestaurantDetail)
    assert result.rating == "4.0"
    assert result.review_count == "23"
    assert result.blog_review_count == "13"
    assert isinstance(result.business_status, list)
    assert result.business_status[0] == "영업 마감"
    assert result.business_status[1] == "내일 10:50 오픈"
    assert result.source == "kakao_crawl"

def test_parse_body_menus(scraper):
    """메뉴 파싱 테스트"""
    html_text = """
    메뉴
    대표
    해물쟁반짜장
    10,000원
    메뉴
    탕수육
    15,000원
    가격
    """
    
    result = scraper.parse_body(html_text)
    
    assert len(result.menus) == 2
    assert result.menus[0].name == "해물쟁반짜장"
    assert result.menus[0].price == "10,000원"
    assert result.menus[1].name == "탕수육"
    assert result.menus[1].price == "15,000원"

def test_parse_body_empty(scraper):
    """빈 텍스트 파싱 시 기본값 반환 테스트"""
    result = scraper.parse_body("")
    
    assert isinstance(result, RestaurantDetail)
    assert result.rating == "0.0"
    assert result.review_count == "0"
    assert result.business_status == ["정보 없음"]
    assert len(result.menus) == 0