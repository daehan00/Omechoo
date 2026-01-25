import pytest
from unittest.mock import AsyncMock, Mock, ANY
from datetime import datetime, timedelta, timezone

from app.services.restaurant_detail import RestaurantDetailService
from app.domain.entities.restaurant_detail import RestaurantDetail, MenuDetail
from app.models.restaurant_detail import RestaurantDetailModel
from app.core.exceptions import InvalidUrlError

@pytest.fixture
def mock_repo():
    return Mock()

@pytest.fixture
def mock_scraper():
    scraper = Mock()
    scraper.get_details = AsyncMock() # 비동기 메서드 Mock
    return scraper

@pytest.fixture
def service(mock_repo, mock_scraper):
    return RestaurantDetailService(mock_repo, mock_scraper)

@pytest.mark.asyncio
async def test_get_detail_cache_hit(service, mock_repo, mock_scraper):
    """캐시가 유효하면 DB에서 바로 반환해야 한다."""
    # Given
    place_id = "12345"
    url = f"https://place.map.kakao.com/{place_id}"
    
    # 1일 전 업데이트된 데이터 (유효)
    cached_data = RestaurantDetailModel(
        id=place_id,
        updated_at=datetime.now(timezone.utc) - timedelta(days=1),
        menus=[{"name": "짜장", "price": "5000"}],
        rating="4.0",
        review_count="10",
        blog_review_count="5",
        business_status=["영업중"]
    )
    mock_repo.get.return_value = cached_data
    
    # When
    result = await service.get_detail(url)
    
    # Then
    assert isinstance(result, RestaurantDetail)
    assert result.menus[0].name == "짜장"
    assert result.source == "database_cache"
    
    # 크롤러는 호출되지 않아야 함
    mock_scraper.get_details.assert_not_called()
    # 저장도 호출되지 않아야 함
    mock_repo.save.assert_not_called()

@pytest.mark.asyncio
async def test_get_detail_cache_miss(service, mock_repo, mock_scraper):
    """캐시가 없으면 크롤링 후 저장해야 한다."""
    # Given
    place_id = "12345"
    url = f"https://place.map.kakao.com/{place_id}"
    
    mock_repo.get.return_value = None # 캐시 없음
    
    # 크롤링 결과 Mock
    scraped_data = RestaurantDetail(
        rating="4.5", review_count="10", blog_review_count="5", business_status=["영업중"], menus=[]
    )
    mock_scraper.get_details.return_value = scraped_data
    
    # 저장 후 반환될 모델 Mock
    saved_model = RestaurantDetailModel(
        id=place_id, 
        updated_at=datetime.now(timezone.utc),
        rating="4.5",
        review_count="10",
        blog_review_count="5",
        business_status=["영업중"],
        menus=[]
    )
    mock_repo.save.return_value = saved_model
    
    # When
    result = await service.get_detail(url)
    
    # Then
    assert isinstance(result, RestaurantDetail)
    assert result.rating == "4.5"
    assert result.source == "kakao_map_crawl (cached)"
    
    mock_scraper.get_details.assert_called_once_with(url)
    mock_repo.save.assert_called_once_with(place_id, scraped_data)

@pytest.mark.asyncio
async def test_get_detail_cache_expired(service, mock_repo, mock_scraper):
    """캐시가 만료(3일 경과)되었으면 재크롤링해야 한다."""
    # Given
    place_id = "12345"
    url = f"https://place.map.kakao.com/{place_id}"
    
    # 4일 전 데이터 (만료)
    expired_data = RestaurantDetailModel(
        id=place_id,
        updated_at=datetime.now(timezone.utc) - timedelta(days=4)
    )
    mock_repo.get.return_value = expired_data
    
    # 크롤링 및 저장 Mock
    scraped_data = RestaurantDetail(
        rating="5.0", review_count="100", blog_review_count="50", business_status=["마감"], menus=[]
    )
    mock_scraper.get_details.return_value = scraped_data
    
    new_model = RestaurantDetailModel(
        id=place_id, 
        updated_at=datetime.now(timezone.utc),
        rating="5.0",
        review_count="100",
        blog_review_count="50",
        business_status=["마감"],
        menus=[]
    )
    mock_repo.save.return_value = new_model
    
    # When
    result = await service.get_detail(url)
    
    # Then
    assert isinstance(result, RestaurantDetail)
    assert result.rating == "5.0"
    mock_scraper.get_details.assert_called_once() # 크롤링 호출됨
    mock_repo.save.assert_called_once() # 저장 호출됨

@pytest.mark.asyncio
async def test_get_detail_invalid_url(service, mock_repo, mock_scraper):
    """URL에서 ID를 추출할 수 없으면 InvalidUrlError를 발생시켜야 한다."""
    # Given
    url = "https://weird-url.com/no-id"
    
    # When & Then
    with pytest.raises(InvalidUrlError) as excinfo:
        await service.get_detail(url)
    
    assert "유효하지 않은 카카오맵 URL입니다" in str(excinfo.value)
    mock_repo.get.assert_not_called()
    mock_repo.save.assert_not_called()
    mock_scraper.get_details.assert_not_called()