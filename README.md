# Omechoo 🍚

> **오늘 메뉴 추천** - 결정 장애를 위한 점심/저녁 메뉴 추천 및 식당 검색 서비스

Omechoo는 사용자의 상황과 취향에 맞는 메뉴를 추천해주고, 주변 식당 정보를 제공하여 메뉴 결정부터 식당 방문까지의 고민을 해결해주는 웹 애플리케이션입니다.

## 🚀 배포 주소
- [https://daehan00.github.io/Omechoo/](https://daehan00.github.io/Omechoo/)
  > 현재 GitHub Pages를 통해 프론트엔드 정적 페이지만 배포되어 있습니다. (백엔드 연결 대기 중)

## 💻 실행 방법

이 프로젝트는 `frontend` 디렉토리의 스크립트를 통해 백엔드와 프론트엔드를 동시에 실행할 수 있습니다.

### 사전 준비
1. **Python 3.10+**: `app/requirements.txt` 의존성 설치 및 가상환경 설정 권장
2. **Node.js 20+**: `frontend` 디렉토리에서 패키지 설치 필요

### 서버 실행

```bash
# 1. 백엔드 의존성 설치 (최초 1회)
pip install -r app/requirements.txt

# 2. 프론트엔드 디렉토리 이동 및 의존성 설치 (최초 1회)
cd frontend
npm install

# 3. 통합 실행 (백엔드 + 프론트엔드)
npm run dev
```

> **참고**: `npm run dev`는 `concurrently`를 사용하여 `start_backend.sh`와 `vite`를 동시에 실행합니다. 개별 실행이 필요한 경우 `npm run dev:frontend` 또는 `npm run dev:backend`를 사용할 수 있습니다.

## 🛠 기술 스택

### Frontend
- **Framework**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State/Query**: TanStack Query (React Query)
- **Router**: React Router v7

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLAlchemy (ORM)
- **Crawling**: BeautifulSoup4, Selenium

## 📂 프로젝트 구조

```
Omechoo/
├── app/                # Backend (FastAPI)
│   ├── api/            # API Endpoints
│   ├── core/           # Config, Auth, Exceptions
│   ├── db/             # Database Connection & Session
│   ├── domain/         # Domain Entities & Interfaces
│   ├── infrastructure/ # External Services (Kakao Map, Crawler)
│   ├── models/         # DB Models
│   ├── schemas/        # Pydantic Schemas (DTO)
│   └── services/       # Business Logic
│
├── frontend/           # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/        # API Client
│   │   ├── components/ # Reusable UI Components
│   │   ├── features/   # Feature-based Modules (Home, Menu, Restaurant, Room)
│   │   └── types/      # TypeScript Definitions
│   └── public/
│
└── tests/              # Tests (Pytest)
```

## ✨ 주요 기능

1.  **메뉴 추천**
    *   카테고리, 맵기, 온도 등 취향 기반 추천 (Wizard Mode)
    *   랜덤 뽑기 게임 (Gacha Mode)
2.  **식당 검색**
    *   추천받은 메뉴를 판매하는 주변 식당 검색
    *   카카오맵 연동을 통한 위치 확인
    *   영업 정보 및 리뷰 요약 제공
3.  **함께 고르기**
    *   링크 공유를 통한 실시간 투표 방 생성
    *   친구들과 메뉴/식당 투표 진행