import re
from datetime import datetime, timedelta, timezone

from app.infrastructure.repositories.sqlalchemy.restaurant_detail import RestaurantDetailRepository
from app.domain.interfaces.scraper import RestaurantScraper
from app.domain.entities.restaurant_detail import RestaurantDetail, MenuDetail
from app.core.exceptions import InvalidUrlError
from app.models.restaurant_detail import RestaurantDetailModel

class RestaurantDetailService:
    # URL에서 Place ID 추출용 정규식
    PLACE_ID_PATTERN = re.compile(r'kakao\.com/(?:.*/)?(\d+)')

    def __init__(
        self, 
        repository: RestaurantDetailRepository, 
        scraper: RestaurantScraper
    ):
        self._repository = repository
        self._scraper = scraper

    async def get_detail(self, url: str) -> RestaurantDetail:
        """
        URL에 해당하는 식당 상세 정보를 조회합니다.
        캐시가 유효하면 DB에서, 아니면 크롤링 후 저장하여 반환합니다.
        """
        # 1. Place ID 추출
        match = self.PLACE_ID_PATTERN.search(url)
        place_id = match.group(1) if match else None
        
        if not place_id:
            raise InvalidUrlError(f"유효하지 않은 카카오맵 URL입니다: {url}")
        
        # 2. 캐시 확인
        cached = self._repository.get(place_id)
        if cached:
            # 타임존 처리
            last_updated: datetime = cached.updated_at # type: ignore
            if isinstance(last_updated, datetime):
                if last_updated.tzinfo is None:
                    last_updated = last_updated.replace(tzinfo=timezone.utc)
            
            # 유효기간(3일) 체크
            if datetime.now(timezone.utc) - last_updated < timedelta(days=3):
                return self._map_model_to_entity(cached, source="database_cache")

        # 3. 크롤링 수행
        detail: RestaurantDetail = await self._scraper.get_details(url)
        
        # 4. DB 저장 및 반환
        saved = self._repository.save(place_id, detail)
        return self._map_model_to_entity(saved, source="kakao_map_crawl (cached)")

    def _map_model_to_entity(self, model: RestaurantDetailModel, source: str) -> RestaurantDetail:
        menus = []
        if model.menus is not None and len(model.menus) > 0: # type: ignore
             # DB stores as list[dict], Entity needs list[MenuDetail]
             menus = [MenuDetail(name=m["name"], price=m["price"]) for m in model.menus] # type: ignore
        
        return RestaurantDetail(
            rating=str(model.rating), 
            review_count=str(model.review_count),
            blog_review_count=str(model.blog_review_count),
            business_status=model.business_status, # type: ignore
            menus=menus,
            source=source,
            updated_at=model.updated_at # type: ignore
        )