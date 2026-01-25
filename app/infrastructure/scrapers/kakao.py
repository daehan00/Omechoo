import asyncio
import re
from dataclasses import dataclass
from playwright.async_api import async_playwright


@dataclass
class ScrapedMenu:
    name: str
    price: str


@dataclass
class KakaoRestaurantDetail:
    rating: str
    review_count: str
    blog_review_count: str
    business_status: list[str]
    menus: list[ScrapedMenu]


class KakaoRestaurantScraper:
    def __init__(self):
        pass

    async def get_details(self, place_url: str) -> KakaoRestaurantDetail:
        """
        식당 상세 페이지 URL을 받아 크롤링하여 추가 정보를 반환합니다.
        """
        # URL에 #menuInfo가 없으면 추가 (메뉴 탭 강제 이동)
        if "#" not in place_url:
            url = f"{place_url}#menuInfo"
        else:
            url = place_url

        print(f"[Scraper] Crawling: {url}")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            )
            page = await context.new_page()
            
            try:
                # 페이지 로드 타임아웃 10초
                await page.goto(url, wait_until='networkidle', timeout=10000)
                await asyncio.sleep(1.5) # JS 렌더링 및 탭 전환 대기
                
                body_text = await page.inner_text('body')
                return self.parse_body(body_text)
                
            except Exception as e:
                print(f"[Scraper] Error scraping {place_url}: {e}")
                # 실패 시 빈 객체 반환 (상위 로직에서 처리)
                return KakaoRestaurantDetail("0.0", "0", "0", [], [])
            finally:
                await browser.close()

    def parse_body(self, body_text: str) -> KakaoRestaurantDetail:
        """HTML 텍스트에서 데이터를 추출합니다 (Testable)."""
        rating = self._extract_regex(r'별점\s+([0-9.]+)', body_text, "0.0")
        review_count = self._extract_regex(r'후기\s+([0-9,]+)', body_text, "0").replace(',', '')
        blog_count = self._extract_regex(r'블로그\s*([0-9,]+)', body_text, "0").replace(',', '')
        
        # 영업 상태 분리 로직
        # 1. 전체 라인을 먼저 찾음 (예: 영업 마감내일 10:50 오픈)
        raw_status = self._extract_regex(r'(영업\s*(?:중|마감|종료)[^\n]*)', body_text, "")
        status_list = []
        if raw_status:
            # 2. 상태(영업 중/마감)와 시간 정보 분리
            # 예: "영업 마감" / "내일 10:50 오픈"
            split_match = re.match(r'(영업\s*(?:중|마감|종료))\s*(.*)', raw_status)
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
        
        return KakaoRestaurantDetail(
            rating=rating,
            review_count=review_count,
            blog_review_count=blog_count,
            business_status=status_list,
            menus=menus
        )

    def _extract_regex(self, pattern: str, text: str, default: str) -> str:
        match = re.search(pattern, text)
        return match.group(1) if match else default

    def _parse_menus(self, text: str) -> list[ScrapedMenu]:
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
                        menus.append(ScrapedMenu(name=name, price=price))
        
        return menus[:20]

