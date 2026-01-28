# 익명 투표 방 (Lunch Room) 프론트엔드 구현 계획

## 1. 개요 (Overview)
본 문서는 오메추(Omechoo)의 **"익명 투표 방 (Lunch Room)"** 기능의 프론트엔드 구현 전략을 정의합니다.
로그인 없이 링크 공유만으로 팀원들과 메뉴를 투표할 수 있는 기능으로, `docs/FRONTEND_RULES.md`의 디자인 원칙과 `docs/ROOM_API_GUIDE.md`의 명세를 따릅니다.

---

## 2. 사용자 흐름 (User Flow)

### 2-1. 방장 (Host)
1.  **방 생성**: 메인 홈 또는 메뉴 모드에서 "같이 고르기" 선택 → 방 만들기 폼(이름, 후보군 설정) 작성.
2.  **공유 및 대기**: 생성된 링크를 카카오톡/슬랙 등으로 공유 → 대기실에서 참여자 입장 확인.
3.  **투표 시작**: 인원이 모이면 "투표 시작" 버튼 클릭.
4.  **투표 참여**: 본인의 표 행사 (선택/변경 가능).
5.  **투표 종료**: "투표 종료" 버튼을 눌러 결과 확정.

### 2-2. 참여자 (Participant)
1.  **입장**: 공유받은 링크(`https://omechoo.../rooms/{id}`)로 접속.
2.  **닉네임 설정**: 닉네임 입력 후 입장 (중복 시 경고).
3.  **대기**: 투표 시작 전까지 대기실 화면 표시 (참여자 목록 실시간 갱신).
4.  **투표**: 투표 화면으로 전환되면 후보 중 하나를 선택.
5.  **결과 확인**: 투표 종료 후 1등 메뉴(Winner) 및 전체 통계 확인.

---

## 3. 디렉토리 구조 (Feature-based)

`src/features/room` 하위에 모든 관련 코드를 응집시킵니다.

```bash
src/features/room/
├── api/
│   ├── client.ts         # Room 전용 Axios 인스턴스 (Interceptor 설정)
│   └── endpoints.ts      # API 호출 함수 모음
├── components/
│   ├── RoomLayout.tsx    # 공통 레이아웃 (헤더, 상태 배지 등)
│   ├── CandidateCard.tsx # 투표 후보 카드 UI
│   ├── UserList.tsx      # 참여자 목록 (Avatar)
│   ├── ShareButton.tsx   # 링크 복사 버튼
│   └── ResultChart.tsx   # 투표 결과 그래프
├── hooks/
│   ├── useRoom.ts        # 방 정보 폴링 (useQuery)
│   ├── useRoomAuth.ts    # 토큰/권한 관리
│   └── useRoomActions.ts # 투표, 시작, 종료 등 Mutation
├── pages/
│   ├── CreateRoomPage.tsx # 방 생성 폼
│   └── RoomPage.tsx       # 대기/투표/결과 통합 페이지 (상태에 따라 뷰 전환)
└── types/
    └── index.ts          # API Guide 기반 타입 정의
```

---

## 4. 화면 및 UI 설계

### 4-1. 디자인 원칙 및 UX 전략
*   **Flow A (추천 결과에서 생성)**: 추천 결과 화면(`MenuResult`) 하단에 `[친구들과 투표하기]` 버튼 추가. 클릭 시 다중 선택 모드로 전환.
*   **Flow B (홈에서 바로 생성)**: 홈 화면(`HomePage`)에 `[같이 고르기]` 버튼 추가. 빈 후보군에서 시작.
*   **Candidate Handling**:
    *   `menu`: `value`에 메뉴명 입력.
    *   `restaurant`: `value`에 식당 URL, `display_name`에 식당 이름을 매핑하여 생성 요청.

### 4-2. 상태별 화면 구성 (`RoomPage.tsx`)

| 상태 (Status) | 주요 UI 요소 | 액션 버튼 |
|:---:|:---|:---|
| **Waiting** | - QR코드/초대 링크 카드<br>- 접속한 유저 리스트 (Avatar Grid)<br>- 방 설정 요약 (후보군 등) | **Host**: "투표 시작하기"<br>**Guest**: "잠시만 기다려주세요" (Disabled) |
| **Voting** | - 후보 리스트 (Grid/List)<br>- 실시간 득표수(옵션)<br>- 내 선택 표시 (Highlight) | "이걸로 투표하기" / "선택 변경하기"<br>**Host**: "투표 종료하기" (상단 배치) |
| **Closed** | - 🏆 우승 후보 (폭죽 효과)<br>- 전체 득표 결과 (Bar Chart)<br>- "식당 찾기" 버튼 | "홈으로" / "주변 식당 찾기" |

---

## 5. 핵심 기술 구현 전략

### 5-1. 인증 및 토큰 관리 (`useRoomAuth`)
*   **저장소**: `localStorage` 사용. 키 형식: `room_token_{roomId}`.
*   **로직**:
    *   URL의 `roomId`를 기반으로 토큰 존재 여부 확인.
    *   토큰이 없거나 만료된 경우 → "입장(닉네임 입력)" 모달/페이지 띄움.
    *   토큰이 유효한 경우 → 자동으로 API 헤더에 `Authorization: Bearer ...` 추가.
*   **Host 판별**: JWT 페이로드 디코딩하여 `is_host` 값 확인.

### 5-2. 실시간 데이터 동기화 (Polling)
*   **React Query**: `useQuery` 사용.
*   **Interval**:
    *   `waiting`: 3초 (빠른 입장 확인)
    *   `voting`: 2초 (실시간 투표 현황 - 긴박감 조성)
    *   `closed`: 폴링 중단 (`enabled: false`)
*   **최적화**: 윈도우 포커스 시 즉시 갱신 (`refetchOnWindowFocus: true`).

### 5-3. 에러 핸들링
*   **401 (Unauthorized)**: "세션이 만료되었습니다." → 닉네임 입력 화면으로 리셋.
*   **404 (Not Found)**: "존재하지 않거나 삭제된 방입니다." → 홈으로 이동.
*   **409 (Conflict)**: "이미 누군가 사용 중인 닉네임입니다." → 재입력 유도.

---

## 6. 개발 단계 (Roadmap)

### Phase 1: 기반 작업
1.  `src/features/room/types/index.ts`: API 명세에 따른 타입 정의.
2.  `src/features/room/api/`: Axios 클라이언트 및 엔드포인트 구현.
3.  `src/features/room/hooks/useRoomAuth.ts`: 토큰 관리 로직 구현.

### Phase 2: 방 생성 및 입장
1.  `CreateRoomPage`: 방 생성 폼 및 API 연동.
2.  `RoomPage` (Initial): 토큰 없을 시 닉네임 입력 모달 구현.
3.  입장 성공 시 로컬 스토리지 저장 및 대기 화면 진입 확인.

### Phase 3: 대기 및 투표 로직
1.  `useRoom` 훅 구현 (폴링).
2.  **Waiting View**: 참여자 목록 표시, 공유 기능, 방장(Start) 액션.
3.  **Voting View**: 후보 렌더링, 투표(Vote/Change) API 연동.

### Phase 4: 결과 및 마무리
1.  **Closed View**: 결과 차트 및 우승 메뉴 강조 UI.
2.  식당 검색 연동 (우승 메뉴 ID 전달).
3.  UI 폴리싱 (애니메이션, 에러 메시지 다듬기).
