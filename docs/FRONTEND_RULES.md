# Omechoo Frontend Coding Rules & Design Principles

이 문서는 오메추(Omechoo) 프로젝트의 프론트엔드 개발 및 디자인 가이드라인을 정의합니다.

---

## 🎨 UX/UI 디자인 원칙

### 1. Mobile First & Touch Friendly
- 사용자가 주로 모바일 기기에서 고민을 해결할 것을 가정하여 설계합니다.
- 터치하기 쉬운 충분한 크기의 버튼(최소 44x44px)과 간격을 유지합니다.

### 2. Appetizing Colors (식욕 중심의 색상 체계)
- **Primary:** Warm Orange (`#F97316`, `orange-500`) 또는 Red 계열을 사용하여 식욕을 자극합니다.
- **Secondary:** 깔끔한 White와 Light Gray (`gray-50`) 배경으로 콘텐츠의 가독성을 높입니다.
- **Accent:** 보조 정보에는 Soft Blue나 Green을 사용하여 균형을 맞춥니다.

### 3. Simple & Focused Action
- 결정 장애를 겪는 사용자를 위해 선택지를 단계별로 노출합니다.
- 핵심 기능인 "메뉴 추천받기"가 어느 화면에서든 명확하게 보이도록 배치합니다.

### 4. Meaningful Feedback
- 백엔드 연산이나 크롤링 시 사용자가 기다림을 인지할 수 있도록 스켈레톤(Skeleton) UI 또는 로딩 상태를 명확히 표시합니다.

---

## 🏗️ 아키텍처 및 개발 원칙

### 1. 기능 중심 디렉토리 구조 (Feature-based)
코드의 재사용성보다 **응집도(Cohesion)**를 우선합니다. 특정 도메인(Menu, Restaurant)에만 종속된 컴포넌트는 해당 기능 폴더 내에서 관리합니다.

### 2. 서버 상태 관리 (Server State)
- **TanStack Query (React Query)**를 사용하여 비동기 데이터를 관리합니다.
- 로딩, 에러, 캐싱 처리는 라이브러리에 위임하고, 컴포넌트는 UI 렌더링에 집중합니다.

### 3. 타입 안정성 (Strict Typing)
- 모든 API 요청 및 응답 데이터는 TypeScript Interface로 명확히 정의합니다.
- 백엔드의 Pydantic 모델과 동일한 네이밍 컨벤션을 유지합니다.

### 4. 컴포넌트 설계 (Component Design)
- **Atomic-ish:** 공통 UI 요소(Button, Input)는 `components/ui`에 두어 일관성을 유지합니다.
- **Pure Functions:** UI 컴포넌트는 가급적 순수 함수 형태로 유지하고, 복잡한 로직은 커스텀 훅(`hooks/`)으로 분리합니다.

---

## 📁 디렉토리 구조 가이드

```bash
src/
├── api/             # API 호출 로직 (Axios 인스턴스 및 엔드포인트)
├── components/      # 범용 UI 컴포넌트
│   ├── ui/          # 디자인 시스템 (Button, Card, Modal 등)
│   └── layout/      # 공통 레이아웃 (Header, Footer 등)
├── features/        # 비즈니스 로직 중심의 도메인 폴더
│   ├── menu/        # 메뉴 추천 기능 관련
│   └── restaurant/  # 식당 검색 및 상세 정보 관련
├── hooks/           # 전역 또는 다회용 커스텀 훅
├── types/           # TypeScript 타입 정의
├── App.tsx          # 메인 앱 진입점 및 라우팅
└── main.tsx         # React 렌더링 진입점
```

---

## 🛠️ 기술 스택 (Tech Stack)

- **Framework:** React 19 (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State/Fetching:** TanStack Query, Axios
- **Icons:** Lucide React
- **Standard:** ESLint, Prettier
