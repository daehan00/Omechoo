import pytest
import respx
from httpx import Response
from app.infrastructure.adapters.map.kakao import KakaoSearchLocator
from app.domain.entities.restaurant import Location
from app.core.exceptions import ExternalAPIError

# Mock 데이터
MOCK_API_KEY = "test_api_key"
MOCK_BASE_URL = "https://dapi.kakao.com/v2/local"
SEARCH_URL = f"{MOCK_BASE_URL}/search/keyword.json"

@pytest.fixture
def kakao_locator():
    return KakaoSearchLocator(MOCK_API_KEY, MOCK_BASE_URL)

@pytest.mark.asyncio
@respx.mock
async def test_search_success(kakao_locator):
    """카카오 검색 API 정상 응답 테스트"""
    
    # Mock 응답 데이터
    mock_response = {
        "documents": [
            {
                "place_name": "맛있는 식당",
                "category_name": "음식점 > 한식",
                "phone": "02-1234-5678",
                "road_address_name": "서울 강남구 테헤란로 123",
                "x": "127.0276",  # 경도 (Longitude)
                "y": "37.4982",   # 위도 (Latitude)
                "place_url": "http://place.kakao.com/1234",
                "distance": "500"
            }
        ]
    }
    
    # HTTP 요청 모킹
    route = respx.get(SEARCH_URL).mock(return_value=Response(200, json=mock_response))
    
    # 실행
    location = Location(latitude=37.5, longitude=127.0)
    results = await kakao_locator.search("식당", location, radius_km=1.0)
    
    # 검증
    assert route.called
    assert len(results) == 1
    restaurant = results[0]
    
    assert restaurant.name == "맛있는 식당"
    assert restaurant.phone == "02-1234-5678"
    assert restaurant.location.address == "서울 강남구 테헤란로 123"
    assert restaurant.distance == 500
    
    # 좌표 매핑 확인 (x -> longitude, y -> latitude)
    assert restaurant.location.latitude == 37.4982
    assert restaurant.location.longitude == 127.0276
    
    # 요청 파라미터 확인 (단위 변환 등)
    request = route.calls.last.request
    params = request.url.params
    assert params["query"] == "식당"
    assert params["radius"] == "1000"  # 1.0km -> 1000m
    assert request.headers["Authorization"] == f"KakaoAK {MOCK_API_KEY}"

@pytest.mark.asyncio
@respx.mock
async def test_search_api_error(kakao_locator):
    """API 에러(401 등) 발생 시 ExternalAPIError 발생 테스트"""
    
    respx.get(SEARCH_URL).mock(return_value=Response(401, json={"msg": "Unauthorized"}))
    
    location = Location(latitude=37.5, longitude=127.0)
    
    with pytest.raises(ExternalAPIError) as excinfo:
        await kakao_locator.search("식당", location, radius_km=1.0)
    
    assert "Unauthorized" in str(excinfo.value)


@pytest.mark.asyncio
@respx.mock
async def test_search_parsing_error(kakao_locator):
    """일부 데이터 파싱 실패 시 해당 항목 건너뛰기 테스트"""
    
    mock_response = {
        "documents": [
            {
                "place_name": "정상 식당",
                "x": "127.0", "y": "37.0",
                "place_url": ""
            },
            {
                "place_name": "오류 식당",
                # x, y 좌표 누락 -> ValueError 예상
                "place_url": ""
            }
        ]
    }
    
    respx.get(SEARCH_URL).mock(return_value=Response(200, json=mock_response))
    
    location = Location(latitude=37.5, longitude=127.0)
    results = await kakao_locator.search("식당", location, radius_km=1.0)
    
    # 오류 항목은 제외되고 정상 항목만 반환되어야 함
    assert len(results) == 1
    assert results[0].name == "정상 식당"

def create_mock_item(name, i):
    return {
        "place_name": f"{name}_{i}",
        "category_name": "Food",
        "phone": "010-0000-0000",
        "road_address_name": "Road",
        "x": "127.0",
        "y": "37.0",
        "place_url": "http://url",
        "distance": "100"
    }

@pytest.mark.asyncio
@respx.mock
async def test_search_pagination(kakao_locator):
    """페이지네이션 테스트: 여러 페이지 결과 수집"""
    
    # Page 1 response: 15 items, is_end=False
    page1_docs = [create_mock_item("P1", i) for i in range(15)]
    page1_resp = {
        "meta": {"is_end": False, "pageable_count": 45, "total_count": 45},
        "documents": page1_docs
    }
    
    # Page 2 response: 5 items, is_end=True
    page2_docs = [create_mock_item("P2", i) for i in range(5)]
    page2_resp = {
        "meta": {"is_end": True, "pageable_count": 45, "total_count": 45},
        "documents": page2_docs
    }

    # Mocking
    route = respx.get(SEARCH_URL)
    route.side_effect = [
        Response(200, json=page1_resp),
        Response(200, json=page2_resp)
    ]

    location = Location(latitude=37.5, longitude=127.0)
    results = await kakao_locator.search("query", location, radius_km=1.0)

    assert len(results) == 20
    assert results[0].distance == 100
    assert route.call_count == 2
    
    # Check params of calls
    req1 = route.calls[0].request
    assert req1.url.params["page"] == "1"
    
    req2 = route.calls[1].request
    assert req2.url.params["page"] == "2"

@pytest.mark.asyncio
@respx.mock
async def test_search_limit(kakao_locator):
    """최대 검색 결과 50개 제한 테스트"""
    
    # 4 pages of 15 items = 60 items.
    
    def make_response(page_num):
        docs = [create_mock_item(f"P{page_num}", i) for i in range(15)]
        return Response(200, json={
            "meta": {"is_end": False, "pageable_count": 100, "total_count": 100},
            "documents": docs
        })

    route = respx.get(SEARCH_URL)
    route.side_effect = [
        make_response(1),
        make_response(2),
        make_response(3),
        make_response(4)
    ]

    location = Location(latitude=37.5, longitude=127.0)
    results = await kakao_locator.search("query", location, radius_km=1.0)

    assert len(results) == 50
    assert route.call_count == 4

@pytest.mark.asyncio
@respx.mock
async def test_search_retry_success(kakao_locator):
    """일시적 에러 발생 시 재시도하여 성공하는지 테스트"""
    
    # Mock Response: 1st fail, 2nd success
    success_docs = [create_mock_item("RetrySuccess", 0)]
    success_resp = {
        "meta": {"is_end": True, "pageable_count": 1, "total_count": 1},
        "documents": success_docs
    }
    
    route = respx.get(SEARCH_URL)
    route.side_effect = [
        Response(500, json={"msg": "Server Error"}), # 1st attempt: Fail
        Response(200, json=success_resp)            # 2nd attempt: Success
    ]
    
    location = Location(latitude=37.5, longitude=127.0)
    results = await kakao_locator.search("retry", location, radius_km=1.0)
    
    assert len(results) == 1
    assert results[0].name == "RetrySuccess_0"
    assert route.call_count == 2 # 2 calls total

@pytest.mark.asyncio
@respx.mock
async def test_search_retry_failure(kakao_locator):
    """3회 연속 실패 시 ExternalAPIError 발생 테스트"""
    
    # Mock Response: All fail
    route = respx.get(SEARCH_URL).mock(return_value=Response(500, json={"msg": "Fail"}))
    
    location = Location(latitude=37.5, longitude=127.0)
    
    with pytest.raises(ExternalAPIError):
        await kakao_locator.search("fail", location, radius_km=1.0)
        
    assert route.call_count == 3 # Max retries reached