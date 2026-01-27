import asyncio
import re
from datetime import datetime
from playwright.async_api import async_playwright
from app.domain.entities.restaurant_detail import RestaurantDetail, MenuDetail
from app.domain.interfaces.scraper import RestaurantScraper

class KakaoRestaurantScraper(RestaurantScraper):
    def __init__(self):
        pass

    async def get_details(self, url: str) -> RestaurantDetail:
        """
        식당 상세 페이지 URL을 받아 크롤링하여 추가 정보를 반환합니다.
        """
        # URL에 #menuInfo가 없으면 추가 (메뉴 탭 강제 이동)
        if "#" not in url:
            scrap_url = f"{url}#menuInfo"
        else:
            scrap_url = url

        print(f"[Scraper] Crawling: {scrap_url}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            page = await context.new_page()
            
            try:
                # 페이지 로드 타임아웃 10초
                await page.goto(scrap_url, wait_until='networkidle', timeout=10000)
                await asyncio.sleep(1.5) # JS 렌더링 및 탭 전환 대기
                
                body_text = await page.inner_text('body')
                return self.parse_body(body_text)
                
            except Exception as e:
                print(f"[Scraper] Error scraping {url}: {e}")
                # 실패 시 빈 객체 반환 (상위 로직에서 처리)
                return RestaurantDetail(
                    rating="0.0", 
                    review_count="0", 
                    blog_review_count="0", 
                    business_status=[], 
                    menus=[],
                    source="kakao_crawl_failed"
                )
            finally:
                await browser.close()

    def parse_body(self, body_text: str) -> RestaurantDetail:
        """HTML 텍스트에서 데이터를 추출합니다 (Testable)."""
        rating = self._extract_regex(r'별점\s+([0-9.]+)', body_text, "0.0")
        review_count = self._extract_regex(r'후기\s+([0-9,]+)', body_text, "0").replace(',', '')
        blog_count = self._extract_regex(r'블로그\s*([0-9,]+)', body_text, "0").replace(',', '')
        
        # 영업 상태 분리 로직
        raw_status = self._extract_regex(r'((?:영업\s*)?(?:전|중|마감|종료|브레이크타임|휴무일)[^\n]*)', body_text, "")
        status_list = []
        if raw_status:
            split_match = re.match(r'((?:영업\s*)?(?:전|중|마감|종료|브레이크타임|휴무일))\s*(.*)', raw_status)
            if split_match:
                status_main = split_match.group(1).strip()
                status_sub = split_match.group(2).strip()
                status_list = [status_main]
                if status_sub:
                    status_list.append(status_sub)
            else:
                status_list = [raw_status.strip()]
        else:
            status_list = ["정보 없음"]
        
        menus = self._parse_menus(body_text)
        
        return RestaurantDetail(
            rating=rating,
            review_count=review_count,
            blog_review_count=blog_count,
            business_status=status_list,
            menus=menus,
            source="kakao_crawl",
            updated_at=datetime.now()
        )

    def _extract_regex(self, pattern: str, text: str, default: str) -> str:
        match = re.search(pattern, text)
        return match.group(1) if match else default

    def _parse_menus(self, text: str) -> list[MenuDetail]:
        menus = []
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        for i in range(len(lines)):
            line = lines[i]
            # 가격 패턴 (3자리 숫자 + 원)
            if '원' in line and re.search(r'[0-9,]{3,}원', line):
                price = line
                name = ""
                # 가격 위쪽 라인 탐색
                for j in range(max(0, i-2), i):
                    candidate = lines[j]
                    # 노이즈 필터링
                    if candidate not in ['메뉴', '대표', '추천', '사진', '더보기', '가격', '상세'] and not re.search(r'[0-9,]{3,}원', candidate):
                        name = candidate
                
                if name and len(name) < 50:
                    # 중복 방지
                    if not any(m.name == name for m in menus):
                        menus.append(MenuDetail(name=name, price=price))
        
        return menus[:20]