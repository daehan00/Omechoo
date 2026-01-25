import asyncio
import json
import re
from playwright.async_api import async_playwright

async def get_kakao_summary():
    # URL Hash를 사용하여 메뉴 탭으로 유도
    base_url = 'https://place.map.kakao.com/21553712'
    url = f"{base_url}#menuInfo"
    
    print(f"Crawling {url} ...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        await page.goto(url, wait_until='networkidle')
        await asyncio.sleep(3) # 데이터 로딩 충분히 대기
        
        # 전체 텍스트 획득
        body_text = await page.inner_text('body')
        
        result = {
            'rating': '0.0',
            'review_count': '0',
            'blog_review_count': '0',
            'business_status': '정보 없음',
            'menus': []
        }
        
        # 1. 기본 정보 추출 (기존 로직)
        rating_match = re.search(r'별점\s+([0-9.]+)', body_text)
        if rating_match: result['rating'] = rating_match.group(1)
            
        review_match = re.search(r'후기\s+([0-9,]+)', body_text)
        if review_match: result['review_count'] = review_match.group(1).replace(',', '')
            
        blog_match = re.search(r'블로그\s*([0-9,]+)', body_text)
        if blog_match: result['blog_review_count'] = blog_match.group(1).replace(',', '')
            
        status_match = re.search(r'(영업\s*(중|마감|종료)[^\n]+)', body_text)
        if status_match: result['business_status'] = status_match.group(1).strip()

        # 2. 메뉴 정보 추출 (개선된 로직)
        print("Parsing menus from text...")
        
        # '메뉴' 또는 '대표' 키워드를 포함한 줄을 찾고, 그 주변의 가격 정보를 수집
        lines = [line.strip() for line in body_text.split('\n') if line.strip()]
        
        for i in range(len(lines)):
            line = lines[i]
            
            # 가격 패턴 (예: 7,500원, 10,000원)
            if '원' in line and re.search(r'[0-9,]{3,}원', line):
                price = line
                # 가격 위 1~2줄 내에서 메뉴명을 찾음
                # '메뉴', '대표', '추천' 등은 제외
                name = ""
                for j in range(max(0, i-2), i):
                    candidate = lines[j]
                    if candidate not in ['메뉴', '대표', '추천', '사진', '더보기'] and not re.search(r'[0-9,]{3,}원', candidate):
                        name = candidate
                
                if name and len(name) < 40: # 너무 긴 문장은 제외
                    # 중복 제거 후 추가
                    if not any(m['name'] == name for m in result['menus']):
                        result['menus'].append({'name': name, 'price': price})

        # 주류 메뉴 전용 (19세 이상)
        for i in range(len(lines)):
            if '19세 이상' in lines[i]:
                name = lines[i]
                if i + 1 < len(lines) and '원' in lines[i+1]:
                    result['menus'].append({'name': name, 'price': lines[i+1]})

        print(json.dumps(result, ensure_ascii=False, indent=2))
        await browser.close()

if __name__ == '__main__':
    asyncio.run(get_kakao_summary())
