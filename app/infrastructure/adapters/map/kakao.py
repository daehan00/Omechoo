import httpx
import uuid
from tenacity import retry, stop_after_attempt, retry_if_exception_type

from app.domain.interfaces.locator import RestaurantLocator
from app.domain.entities.restaurant import Restaurant, Location
from app.core.exceptions import ExternalAPIError


class KakaoSearchLocator(RestaurantLocator):
    def __init__(self, api_key: str, base_url: str) -> None:
        self.api_key = api_key
        self.base_url = base_url

    @retry(
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(httpx.HTTPError),
        reraise=True
    )
    async def _fetch_page(self,
        client: httpx.AsyncClient,
        url: str,
        params: dict,
        headers: dict
    ) -> httpx.Response:
        """API 요청 수행 (재시도 로직 포함)"""
        response = await client.get(
            url=url,
            params=params,
            headers=headers,
            timeout=5.0
        )
        response.raise_for_status()
        return response

    async def search(self,
        query: str,
        location: Location,
        radius_km: float
    ) -> list[Restaurant]:
        search_url = f"{self.base_url}/search/keyword.json"
        headers = {
            "Authorization": f"KakaoAK {self.api_key}"
        }
        
        # 카카오 API: radius 단위는 미터(m)
        radius_m = int(radius_km * 1000)
        
        restaurant_list = []
        page = 1
        MAX_RESULTS = 50  # 최대 검색 결과 수 제한

        async with httpx.AsyncClient() as client:
            while len(restaurant_list) < MAX_RESULTS:
                params = {
                    "query": query,
                    "x": str(location.longitude),  # 경도
                    "y": str(location.latitude),   # 위도
                    "radius": radius_m,
                    "category_group_code": "FD6",  # 음식점 코드
                    "page": page,
                    "size": 15
                }

                try:
                    response = await self._fetch_page(client, search_url, params, headers)
                except httpx.HTTPError as e:
                    # 3회 재시도 후에도 실패 시 예외 변환하여 발생
                    raise ExternalAPIError("KakaoMap", str(e)) from e
            
                result = response.json()
                documents = result.get("documents", [])
                meta = result.get("meta", {})

                if not documents:
                    break

                for item in documents:
                    if len(restaurant_list) >= MAX_RESULTS:
                        break

                    try:
                        # 좌표 변환: y -> latitude, x -> longitude
                        lat = float(item["y"])
                        lon = float(item["x"])
                        
                        dist_str = item.get("distance", "")
                        distance_val = int(dist_str) if dist_str else None

                        restaurant_list.append(Restaurant(
                            id=str(uuid.uuid4()), # 혹은 item["id"] 사용 가능
                            name=item["place_name"],
                            category=item.get("category_name", ""),
                            location=Location(latitude=lat, longitude=lon, address=item.get("road_address_name") or item.get("address_name")),
                            phone=item.get("phone"),
                            urls=[item["place_url"]] if item.get("place_url") else [],
                            distance=distance_val
                        ))
                    except (ValueError, KeyError) as e:
                        print(f"[KakaoSearchLocator] Parsing Error for item {item.get('place_name')}: {e}")
                        continue
                
                if meta.get("is_end", True):
                    break
                
                page += 1
        
        return restaurant_list