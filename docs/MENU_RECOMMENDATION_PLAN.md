# 메뉴 추천 기능 프론트엔드 구현 기획안 (Updated)

## 1. 개요 (Overview)
본 문서는 오메추(Omechoo) 서비스의 핵심 기능인 **"메뉴 추천(Menu Recommendation)"**의 프론트엔드 구현 현황 및 향후 계획을 정의합니다.
사용자의 결정 장애를 해소하기 위해 현재 **2가지 핵심 방식(Wizard, Random)**이 구현되어 있으며, 추후 AI 기반 추천 및 태그 선택형이 추가될 예정입니다.

---

## 2. 사용자 흐름 (User Flow)

```mermaid
graph TD
    A[메인 홈] -->|메뉴 추천받기 클릭| B[추천 방식 선택 (Mode Selection)]
    
    B -->|꼼꼼하게 고를래| C[1. 단계별 질문형 (Wizard) - 구현완료]
    B -->|운에 맡길래| D[2. 랜덤 게임형 (Game) - 구현완료]
    B -->|AI에게| E[3. AI 추천형 - 준비중]
    
    C --> F{API 요청}
    D --> F
    
    F -->|로딩/애니메이션| G[추천 결과 화면]
    G -->|마음에 안 듦| F
    G -->|이거 먹을래!| H[주변 식당 찾기 이동]
```

---

## 3. 상세 화면 설계

### 3-1. 추천 방식 선택 페이지 (`/menu/mode`) - **[구현 완료]**
사용자가 진입 시 가장 먼저 만나는 화면입니다. 현재 사용 가능한 모드와 준비 중인 모드를 구분하여 제공합니다.

| UI 요소 | 설명 | 상태 |
|:---:|:---|:---|
| **헤더** | "어떤 방식으로<br>골라볼까요?" | 구현 완료 |
| **카드 1** | **단계별 질문형** (Wizard) | **Active** |
| **카드 2** | **AI 추천형** | **Disabled** (Alert: 준비중) |
| **카드 3** | **랜덤 게임형** (Game) | **Active** |
| **카드 4** | **태그 선택형** (Keyword) | **Hidden** (코드 주석 처리됨) |

---

### 3-2. [Mode 1] 단계별 질문형 (Wizard) - **[구현 완료]**
질문을 하나씩 던져 선택지를 좁혀가는 방식입니다. (`/menu/recommend/wizard`)
스와이프 제스처를 통해 이전 단계로 돌아갈 수 있으며, 중간에 "바로 추천"을 받을 수도 있습니다.

*   **Step 1: 카테고리 선택**
    *   질문: "어떤 종류가 땡기시나요?"
    *   UI: 한식, 중식, 일식, 양식, 아시안, 패스트푸드, 퓨전, 기타 (8종 그리드)
    *   로직: 다중 선택 가능

*   **Step 2: 주재료 (Main Base) - *Added***
    *   질문: "오늘의 주식(Main)은?"
    *   UI: 밥, 면, 고기, 빵/밀가루, 해산물, 채소, 기타 (리스트형)
    *   로직: 다중 선택 가능

*   **Step 3: 상세 속성 (Details)**
    *   **맵기:** 안매움 ~ 아주 매움 (5단계) 또는 상관없음
    *   **온도:** 뜨거운 / 미지근 / 차가운 (아이콘)
    *   **헤비함:** 가볍게 / 적당히 / 헤비하게 (아이콘) - *Added*

*   **Step 4: 결과 (Result)**
    *   카드 형태의 메뉴 추천 결과 리스트 (`MenuResult` 컴포넌트)

---

### 3-3. [Mode 2] 랜덤 게임형 (Game) - **[구현 완료]**
*   **경로:** `/menu/recommend/random`
*   **Concept:** "운명의 메뉴 뽑기 (Gacha Machine)"
*   **UI/UX Implementation:**
    *   CSS와 Tailwind로 구현된 3D 느낌의 **가챠 머신**.
    *   우측 **레버**를 당기면(Click) 애니메이션 시작.
    *   3초간의 긴장감 조성 후 **캡슐**이 배출구로 떨어짐.
    *   캡슐을 클릭(Touch)하면 결과 화면(`MenuResult`)으로 전환.
*   **Logic:**
    *   레버 당김 시 `recommendBasic` API를 호출하며, `limit`을 1~4 사이 랜덤으로 설정하여 의외성을 부여.

---

### 3-4. [Mode 3] AI 추천형 & 태그 선택형 - **[Future]**
*   **AI 추천형:** 사용자 정보, 날씨, 시간대 등을 종합적으로 고려한 개인화 추천 (준비중 표시).
*   **태그 선택형:** `#비오는날`, `#해장` 등 상황별 태그 클릭 시 즉시 추천 (현재 숨김 처리).

---

### 3-5. 추천 결과 페이지 (공통 컴포넌트) - **[구현 완료]**
*   **컴포넌트:** `MenuResult`
*   **기능:**
    *   추천된 메뉴 리스트 표시.
    *   **"주변 식당 찾기"**: 선택한 메뉴 ID를 쿼리 파라미터로 식당 검색 페이지(`/restaurant/search`)로 이동.
    *   **"다시 추천받기"**: 조건을 유지한 채(Wizard) 또는 게임을 초기화하여(Game) 재시도.
    *   **"홈으로"**: 메인 화면 이동.

---

## 4. 데이터 및 상태 관리

### 4-1. API 연동
*   **Endpoint:** `POST /api/menu/recommend/basic`
*   **Request:**
    ```typescript
    {
      included_categories?: string[]; // Step 1
      attributes?: {
        main_base?: string[];     // Step 2
        spiciness?: number;       // Step 3
        temperature?: string;
        heaviness?: number;
      };
      limit: number; // Wizard: 10, Game: 1~4 (Random)
    }
    ```

### 4-2. State Management
*   **Local State:** 각 페이지(`MenuWizardPage`, `MenuGamePage`) 내부에서 `useState`로 상태 관리.
*   **Wizard:** `step`, `selections` 상태 관리 및 뒤로가기 로직 구현.
*   **Game:** `gameState` ('IDLE' | 'ANIMATING' | 'READY' | 'REVEALED') 상태 머신 구현.

---

## 5. 개발 로드맵 (Status Check)

1.  **Phase 1 (기반 작업):** ✅ **Complete**
    *   `MenuModePage` UI 및 라우팅 구현.
    *   기본 레이아웃 및 공통 컴포넌트(`Button`, `Layout`) 적용.
2.  **Phase 2 (Wizard 구현):** ✅ **Complete**
    *   Step별 UI (Category, MainBase, Details) 구현.
    *   API 연동 및 결과 처리.
    *   스와이프 제스처 및 트랜지션 애니메이션 적용.
3.  **Phase 3 (Game 구현):** ✅ **Complete**
    *   `MenuGamePage` 가챠 머신 UI 및 애니메이션 구현.
    *   상호작용(레버 당기기, 캡슐 열기) 로직 구현.
4.  **Phase 4 (Refinement & Future):** 🚧 **In Progress**
    *   AI 추천 모델 연동 (Backend dependency).
    *   태그 선택형 모드 추가 구현 (우선순위 낮음).
    *   사용자 피드백 반영 및 UI/UX 개선.