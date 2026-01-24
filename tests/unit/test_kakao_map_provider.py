import pytest
import respx
from httpx import Response
from app.infrastructure.adapters.map.kakao import KakaoMapProvider
from app.domain.entities.restaurant import Location
from app.core.exceptions import ExternalAPIError

MOCK_API_KEY = "test_api_key"
MOCK_BASE_URL = "https://dapi.kakao.com/v2/local"

@pytest.fixture
def kakao_map_provider():
    return KakaoMapProvider(MOCK_API_KEY, MOCK_BASE_URL)

@pytest.mark.asyncio
@respx.mock
async def test_search_address_success(kakao_map_provider):
    """주소 검색 성공 테스트"""
    url = f"{MOCK_BASE_URL}/search/address.json"
    mock_resp = {
        "documents": [
            {
                "address_name": "서울 강남구 역삼동 123-45",
                "x": "127.0276",
                "y": "37.4982",
                "address_type": "REGION_ADDR"
            }
        ]
    }
    respx.get(url).mock(return_value=Response(200, json=mock_resp))

    result = await kakao_map_provider.search_address("강남구 역삼동")
    
    assert result is not None
    assert result.address == "서울 강남구 역삼동 123-45"
    assert result.latitude == 37.4982 # float conversion check
    assert result.longitude == 127.0276

@pytest.mark.asyncio
@respx.mock
async def test_search_address_empty(kakao_map_provider):
    """주소 검색 결과 없음"""
    url = f"{MOCK_BASE_URL}/search/address.json"
    mock_resp = {"documents": []}
    respx.get(url).mock(return_value=Response(200, json=mock_resp))

    result = await kakao_map_provider.search_address("없는 주소")
    assert result is None

@pytest.mark.asyncio
@respx.mock
async def test_reverse_geocode_success(kakao_map_provider):
    """좌표 -> 주소 변환 성공 테스트 (coord2address 기준)"""
    # 현재 구현은 coord2regioncode를 쓰고 있으나, 인터페이스 의도는 주소 반환이므로
    # coord2address로 수정할 것을 가정하고 테스트 작성 (또는 현재 구현에 맞춰 테스트 후 수정)
    
    # 일단 현재 구현(coord2regioncode)에 맞춰 테스트를 작성해보고 실패하면 수정 방향을 잡겠습니다.
    # 하지만 코드를 보면 '/geo/coord2regioncode.json'을 호출하고 있습니다.
    # 여기서는 올바른 방향인 '/geo/coord2address.json'을 테스트하겠습니다.
    
    url = f"{MOCK_BASE_URL}/geo/coord2address.json"
    mock_resp = {
        "documents": [
            {
                "road_address": {
                    "address_name": "경기도 성남시 분당구 판교역로 235",
                },
                "address": {
                    "address_name": "경기도 성남시 분당구 삼평동 681"
                }
            }
        ]
    }
    respx.get(url).mock(return_value=Response(200, json=mock_resp))

    result = await kakao_map_provider.reverse_geocode(37.4020, 127.1086)
    
    assert result == "경기도 성남시 분당구 판교역로 235"

