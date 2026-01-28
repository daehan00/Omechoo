# 🗳️ 익명 투표 방 API 가이드

> 프론트엔드 개발자를 위한 Room API 완벽 레퍼런스

**Base URL**: `http://localhost:8000`  
**API Prefix**: `/api/rooms`

---

## 📋 목차

1. [개요](#개요)
2. [인증 방식 (JWT)](#인증-방식-jwt)
3. [API 엔드포인트](#api-엔드포인트)
4. [데이터 타입](#데이터-타입)
5. [에러 처리](#에러-처리)
6. [사용 흐름 예시](#사용-흐름-예시)
7. [프론트엔드 구현 팁](#프론트엔드-구현-팁)

---

## 개요

익명 투표 방 기능을 통해 팀원들이 점심 메뉴를 투표로 결정할 수 있습니다.

### 핵심 개념

| 개념 | 설명 |
|------|------|
| **Room (방)** | 투표가 진행되는 공간. 방장이 생성하고 참여자들이 입장 |
| **Participant (참여자)** | 방에 참여한 사람. 방장(host) 또는 일반 참여자 |
| **Candidate (후보)** | 투표 대상. 메뉴명 또는 식당 URL |
| **Token** | JWT 인증 토큰. 방 생성/참여 시 발급됨 |

### 방 상태 (RoomStatus)

```
waiting → voting → closed
```

| 상태 | 설명 | 가능한 액션 |
|------|------|------------|
| `waiting` | 대기 중 (참여자 모집) | 입장, 투표 시작 (방장) |
| `voting` | 투표 진행 중 | 투표, 투표 변경, 종료 (방장) |
| `closed` | 투표 종료 | 결과 조회만 가능 |

### 후보 타입 (CandidateType)

| 타입 | 설명 | `value` | `display_name` |
|------|------|------|------|
| `menu` | 메뉴 이름 | 메뉴 이름 (예: 짜장면) | (선택) 부연 설명 |
| `restaurant` | 식당 정보 | **식당 상세 URL** | **식당 이름** |

---

## 인증 방식 (JWT)

### 토큰 발급 시점

- **방 생성**: `POST /api/rooms` → 응답에 `token` 포함
- **방 참여**: `POST /api/rooms/{id}/join` → 응답에 `token` 포함

### 토큰 사용 방법

인증이 필요한 API 호출 시 `Authorization` 헤더에 토큰을 포함합니다.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 토큰 저장

```javascript
// 로컬 스토리지에 저장 (방 ID 별로 관리)
const saveToken = (roomId, token) => {
  localStorage.setItem(`room_token_${roomId}`, token);
};

const getToken = (roomId) => {
  return localStorage.getItem(`room_token_${roomId}`);
};
```

### 토큰 페이로드 구조

```json
{
  "room_id": "550e8400-e29b-41d4-a716-446655440000",
  "participant_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "nickname": "김철수",
  "is_host": true,
  "exp": 1706486400
}
```

> ⚠️ **중요**: 토큰을 분실하면 같은 닉네임으로 재입장할 수 없습니다. 다른 닉네임으로 새로 입장해야 합니다.

---

## API 엔드포인트

### 1. 방 생성

새 투표 방을 생성합니다. 생성자는 자동으로 방장이 됩니다.

```
POST /api/rooms
```

**Request Body**:
```json
{
  "name": "점심 뭐먹지?",
  "host_nickname": "김방장",
  "candidate_type": "menu",
  "candidates": [
    { "value": "짜장면" },
    { "value": "짬뽕", "display_name": "얼큰 짬뽕" },
    { "value": "볶음밥" }
  ],
  "max_participants": 10,
  "expires_in_minutes": 30
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string | ✅ | 방 제목 (1~50자) |
| `host_nickname` | string | ✅ | 방장 닉네임 (1~20자) |
| `candidate_type` | string | ✅ | `"menu"` 또는 `"restaurant"` |
| `candidates` | array | ✅ | 후보 목록 (2~10개) |
| `candidates[].value` | string | ✅ | 메뉴명 또는 URL |
| `candidates[].display_name` | string | ❌ | 표시용 이름 |
| `max_participants` | number | ❌ | 최대 참여자 (기본 10, 2~50) |
| `expires_in_minutes` | number | ❌ | 만료 시간 (기본 30분, 5~60) |

**Response** `201 Created`:
```json
{
  "room_id": "550e8400-e29b-41d4-a716-446655440000",
  "share_url": "http://localhost:8000/rooms/550e8400-e29b-41d4-a716-446655440000",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| 필드 | 설명 |
|------|------|
| `room_id` | 방 고유 ID (UUID) |
| `share_url` | 공유용 URL (참여자에게 전달) |
| `token` | JWT 인증 토큰 ⚠️ **안전하게 저장하세요** |

---

### 2. 방 조회

방의 상세 정보를 조회합니다. 인증 없이도 조회 가능합니다.

```
GET /api/rooms/{room_id}
```

**Headers** (선택):
```http
Authorization: Bearer <token>
```

> 💡 토큰을 포함하면 `my_vote` 필드에 내가 투표한 후보 ID가 반환됩니다.

**Response** `200 OK`:
```json
{
  "room": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "점심 뭐먹지?",
    "candidate_type": "menu",
    "candidates": [
      { "id": "c1", "value": "짜장면", "display_name": null },
      { "id": "c2", "value": "짬뽕", "display_name": "얼큰 짬뽕" }
    ],
    "status": "voting",
    "max_participants": 10,
    "participant_count": 5,
    "expires_at": "2026-01-28T13:00:00Z",
    "created_at": "2026-01-28T12:30:00Z"
  },
  "participants": [
    { "nickname": "김방장", "is_host": true, "joined_at": "2026-01-28T12:30:00Z" },
    { "nickname": "철수", "is_host": false, "joined_at": "2026-01-28T12:31:00Z" }
  ],
  "results": [
    {
      "candidate": { "id": "c1", "value": "짜장면", "display_name": null },
      "vote_count": 3,
      "voters": ["김방장", "철수", "영희"]
    },
    {
      "candidate": { "id": "c2", "value": "짬뽕", "display_name": "얼큰 짬뽕" },
      "vote_count": 2,
      "voters": ["민수", "지연"]
    }
  ],
  "my_vote": "c1"
}
```

> 🔒 `participants` 배열에는 참여자 ID가 포함되지 않습니다 (보안상 닉네임만 노출).

---

### 3. 방 참여

닉네임으로 방에 참여합니다.

```
POST /api/rooms/{room_id}/join
```

**Request Body**:
```json
{
  "nickname": "철수"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `nickname` | string | ✅ | 닉네임 (1~20자, 방 내 고유) |

**Response** `200 OK`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "nickname": "철수",
  "is_host": false,
  "room": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "점심 뭐먹지?",
    "status": "waiting",
    ...
  }
}
```

**에러 응답**:

| 코드 | 상황 | 메시지 |
|------|------|--------|
| 404 | 방 없음 | `Room not found` |
| 409 | 닉네임 중복 | `Nickname already taken` |
| 409 | 정원 초과 | `Room is full (max: 10)` |
| 410 | 방 만료 | `Room has expired` |

---

### 4. 투표 시작 🔒

투표를 시작합니다. **방장만 가능**합니다.

```
POST /api/rooms/{room_id}/start
```

**Headers**:
```http
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "점심 뭐먹지?",
  "status": "voting",
  ...
}
```

**에러 응답**:

| 코드 | 상황 | 메시지 |
|------|------|--------|
| 401 | 토큰 없음/만료 | `Not authenticated` |
| 403 | 방장 아님 | `Host permission required` |
| 403 | 다른 방 토큰 | `Token is for a different room` |

---

### 5. 투표하기 🔒

후보에 투표합니다.

```
POST /api/rooms/{room_id}/vote
```

**Headers**:
```http
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "candidate_id": "c1"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Vote cast successfully",
  "results": [
    { "candidate": {...}, "vote_count": 4, "voters": [...] },
    { "candidate": {...}, "vote_count": 2, "voters": [...] }
  ]
}
```

**에러 응답**:

| 코드 | 상황 | 메시지 |
|------|------|--------|
| 400 | 투표 진행 중 아님 | `Room is not in voting status: waiting` |
| 400 | 잘못된 후보 | `Invalid candidate` |
| 409 | 이미 투표함 | `Already voted. Use PATCH to change vote.` |

---

### 6. 투표 변경 🔒

이미 투표한 경우 다른 후보로 변경합니다.

```
PATCH /api/rooms/{room_id}/vote
```

**Headers**:
```http
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "new_candidate_id": "c2"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Vote changed successfully",
  "results": [...]
}
```

---

### 7. 방 종료 🔒

투표를 종료하고 결과를 확정합니다. **방장만 가능**합니다.

```
POST /api/rooms/{room_id}/close
```

**Headers**:
```http
Authorization: Bearer <token>
```

**Response** `200 OK`:
```json
{
  "success": true,
  "final_results": [
    { "candidate": {...}, "vote_count": 4, "voters": ["김방장", "철수", "영희", "민수"] },
    { "candidate": {...}, "vote_count": 2, "voters": ["지연", "수진"] }
  ],
  "winner": {
    "id": "c1",
    "value": "짜장면",
    "display_name": null
  }
}
```

> ⚠️ 동점인 경우 `winner`는 `null`입니다.

---

## 데이터 타입

### RoomStatus

```typescript
type RoomStatus = "waiting" | "voting" | "closed";
```

### CandidateType

```typescript
type CandidateType = "menu" | "restaurant";
```

### TypeScript 인터페이스

```typescript
// === Request Types ===

interface CandidateInput {
  value: string;
  display_name?: string;
}

interface CreateRoomRequest {
  name: string;                      // 1-50자
  host_nickname: string;             // 1-20자
  candidate_type: "menu" | "restaurant";
  candidates: CandidateInput[];      // 2-10개
  max_participants?: number;         // 2-50, 기본 10
  expires_in_minutes?: number;       // 5-60, 기본 30
}

interface JoinRoomRequest {
  nickname: string;  // 1-20자
}

interface CastVoteRequest {
  candidate_id: string;
}

interface ChangeVoteRequest {
  new_candidate_id: string;
}

// === Response Types ===

interface Candidate {
  id: string;
  value: string;
  display_name: string | null;
}

interface Participant {
  nickname: string;
  is_host: boolean;
  joined_at: string;  // ISO 8601
}

interface VoteResult {
  candidate: Candidate;
  vote_count: number;
  voters: string[];  // 닉네임 배열
}

interface Room {
  id: string;
  name: string;
  candidate_type: "menu" | "restaurant";
  candidates: Candidate[];
  status: "waiting" | "voting" | "closed";
  max_participants: number;
  participant_count: number;
  expires_at: string | null;
  created_at: string;
}

interface CreateRoomResponse {
  room_id: string;
  share_url: string;
  token: string;  // JWT
}

interface JoinRoomResponse {
  token: string;
  nickname: string;
  is_host: boolean;
  room: Room;
}

interface RoomDetailResponse {
  room: Room;
  participants: Participant[];
  results: VoteResult[];
  my_vote: string | null;  // 내가 투표한 candidate_id
}

interface VoteResponse {
  success: boolean;
  message: string;
  results: VoteResult[];
}

interface CloseRoomResponse {
  success: boolean;
  final_results: VoteResult[];
  winner: Candidate | null;
}
```

---

## 에러 처리

### HTTP 상태 코드

| 코드 | 의미 | 대응 방법 |
|------|------|----------|
| 400 | 잘못된 요청 | 요청 데이터 확인 |
| 401 | 인증 필요 | 토큰 재확인 또는 재입장 |
| 403 | 권한 없음 | 방장만 가능한 액션 |
| 404 | 리소스 없음 | 방/참여자 존재 확인 |
| 409 | 충돌 | 닉네임 중복, 이미 투표함 등 |
| 410 | 만료됨 | 방이 만료됨 |
| 422 | 유효성 검사 실패 | 필드 값 확인 |

### 에러 응답 형식

```json
{
  "detail": "Room not found"
}
```

### 프론트엔드 에러 핸들링 예시

```typescript
const handleApiError = (error: AxiosError) => {
  const status = error.response?.status;
  const detail = error.response?.data?.detail;

  switch (status) {
    case 401:
      // 토큰 만료 - 재입장 필요
      alert("세션이 만료되었습니다. 다시 입장해주세요.");
      redirectToJoin();
      break;
    case 403:
      alert("권한이 없습니다.");
      break;
    case 409:
      if (detail?.includes("Nickname")) {
        alert("이미 사용 중인 닉네임입니다.");
      } else if (detail?.includes("Already voted")) {
        // 투표 변경 API 호출
        changeVote(candidateId);
      }
      break;
    default:
      alert(detail || "오류가 발생했습니다.");
  }
};
```

---

## 사용 흐름 예시

### 방장 흐름

```
1. 방 생성 (POST /api/rooms)
   → token 저장
   → share_url 공유

2. 참여자 대기 (GET /api/rooms/{id} 폴링)

3. 투표 시작 (POST /api/rooms/{id}/start)
   → Header: Authorization: Bearer {token}

4. 본인 투표 (POST /api/rooms/{id}/vote)

5. 투표 현황 확인 (GET /api/rooms/{id})

6. 투표 종료 (POST /api/rooms/{id}/close)
   → winner 표시
```

### 참여자 흐름

```
1. 공유 링크로 접속
   → room_id 파싱

2. 방 정보 조회 (GET /api/rooms/{id})
   → 방 이름, 후보 확인

3. 닉네임 입력 후 참여 (POST /api/rooms/{id}/join)
   → token 저장

4. 투표 대기 (GET /api/rooms/{id} 폴링)
   → status === "voting" 대기

5. 투표 (POST /api/rooms/{id}/vote)

6. (선택) 투표 변경 (PATCH /api/rooms/{id}/vote)

7. 결과 대기 (GET /api/rooms/{id} 폴링)
   → status === "closed" 대기
```

### curl 예시

```bash
# 1. 방 생성
RESPONSE=$(curl -s -X POST http://localhost:8000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "점심 뭐먹지?",
    "host_nickname": "방장",
    "candidate_type": "menu",
    "candidates": [{"value": "짜장면"}, {"value": "짬뽕"}, {"value": "볶음밥"}]
  }')

ROOM_ID=$(echo $RESPONSE | jq -r '.room_id')
TOKEN=$(echo $RESPONSE | jq -r '.token')

# 2. 참여 (다른 사람)
curl -X POST http://localhost:8000/api/rooms/$ROOM_ID/join \
  -H "Content-Type: application/json" \
  -d '{"nickname": "철수"}'

# 3. 투표 시작 (방장)
curl -X POST http://localhost:8000/api/rooms/$ROOM_ID/start \
  -H "Authorization: Bearer $TOKEN"

# 4. 방 조회 (후보 ID 확인)
curl http://localhost:8000/api/rooms/$ROOM_ID | jq

# 5. 투표 (CANDIDATE_ID는 방 조회에서 확인)
curl -X POST http://localhost:8000/api/rooms/$ROOM_ID/vote \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"candidate_id": "CANDIDATE_ID"}'

# 6. 투표 종료
curl -X POST http://localhost:8000/api/rooms/$ROOM_ID/close \
  -H "Authorization: Bearer $TOKEN"
```

---

## 프론트엔드 구현 팁

### 1. API 클라이언트 설정

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// 토큰 자동 추가 인터셉터
api.interceptors.request.use((config) => {
  const roomId = extractRoomIdFromUrl();
  const token = localStorage.getItem(`room_token_${roomId}`);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 2. 실시간 업데이트 (폴링)

현재 WebSocket은 지원하지 않습니다. 폴링을 사용하세요.

```typescript
const useRoomPolling = (roomId: string, interval = 3000) => {
  const [room, setRoom] = useState<RoomDetailResponse | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.get(`/rooms/${roomId}`);
        setRoom(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchRoom();
    const timer = setInterval(fetchRoom, interval);
    
    return () => clearInterval(timer);
  }, [roomId, interval]);

  return room;
};
```

### 3. 토큰 관리 훅

```typescript
const useRoomToken = (roomId: string) => {
  const key = `room_token_${roomId}`;
  
  const saveToken = (token: string) => {
    localStorage.setItem(key, token);
  };

  const getToken = () => {
    return localStorage.getItem(key);
  };

  const clearToken = () => {
    localStorage.removeItem(key);
  };

  const isAuthenticated = () => {
    const token = getToken();
    if (!token) return false;
    
    // JWT 만료 체크
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  return { saveToken, getToken, clearToken, isAuthenticated };
};
```

### 4. 방장/참여자 구분

```typescript
const useIsHost = (roomId: string): boolean => {
  const { getToken } = useRoomToken(roomId);
  const token = getToken();
  
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.is_host === true;
  } catch {
    return false;
  }
};
```

### 5. 투표 상태별 UI

```typescript
const RoomPage = ({ roomId }: { roomId: string }) => {
  const room = useRoomPolling(roomId);
  const isHost = useIsHost(roomId);

  if (!room) return <Loading />;

  switch (room.room.status) {
    case 'waiting':
      return (
        <WaitingRoom
          room={room}
          canStart={isHost}
          onStart={() => api.post(`/rooms/${roomId}/start`)}
        />
      );
    
    case 'voting':
      return (
        <VotingRoom
          room={room}
          myVote={room.my_vote}
          onVote={(candidateId) => 
            api.post(`/rooms/${roomId}/vote`, { candidate_id: candidateId })
          }
          onChangeVote={(candidateId) =>
            api.patch(`/rooms/${roomId}/vote`, { new_candidate_id: candidateId })
          }
          canClose={isHost}
          onClose={() => api.post(`/rooms/${roomId}/close`)}
        />
      );
    
    case 'closed':
      return <ResultsPage room={room} />;
  }
};
```

---

## 📚 참고

- **API 문서 (Swagger)**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **통합 테스트 스크립트**: `tests/integration/test_room_api.py`

---

*Last updated: 2026-01-28*
