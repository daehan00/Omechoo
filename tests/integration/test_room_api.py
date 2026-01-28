#!/usr/bin/env python3
"""
Room API 통합 테스트 스크립트

사용법:
    1. 서버 실행: cd Backend/omechoo && uvicorn main:app --reload
    2. 테스트 실행: python tests/integration/test_room_api.py

시나리오:
    1. 기본 투표 흐름 (방 생성 → 참여 → 투표 시작 → 투표 → 종료)
    2. 권한 테스트 (비방장이 시작/종료 시도)
    3. 중복 투표 테스트
    4. 투표 변경 테스트
    5. 닉네임 중복 테스트
    6. 정원 초과 테스트
    7. 인증 없이 접근 테스트
    8. 다른 방 토큰으로 접근 테스트
"""
import requests
import json
import sys
from dataclasses import dataclass
from typing import Optional

# 테스트 설정
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/rooms"


@dataclass
class TestResult:
    name: str
    passed: bool
    message: str


class RoomAPITester:
    """Room API 통합 테스트 클래스"""
    
    def __init__(self):
        self.results: list[TestResult] = []
    
    def _log(self, msg: str, indent: int = 0):
        print("  " * indent + msg)
    
    def _success(self, name: str, msg: str = ""):
        self._log(f"✅ {name} {msg}")
        self.results.append(TestResult(name, True, msg))
    
    def _fail(self, name: str, msg: str = ""):
        self._log(f"❌ {name} {msg}")
        self.results.append(TestResult(name, False, msg))
    
    def _header(self, msg: str):
        print(f"\n{'='*60}")
        print(f"  {msg}")
        print(f"{'='*60}")
    
    def _subheader(self, msg: str):
        print(f"\n  📋 {msg}")
        print(f"  {'-'*40}")
    
    def create_room(
        self, 
        name: str = "테스트 방", 
        host_nickname: str = "방장",
        candidates: list[dict] | None = None,
        max_participants: int = 10,
    ) -> dict | None:
        """방 생성"""
        if candidates is None:
            candidates = [{"value": "짜장면"}, {"value": "짬뽕"}, {"value": "볶음밥"}]
        
        response = requests.post(
            API_URL,
            json={
                "name": name,
                "host_nickname": host_nickname,
                "candidate_type": "menu",
                "candidates": candidates,
                "max_participants": max_participants,
                "expires_in_minutes": 30,
            }
        )
        if response.status_code == 201:
            return response.json()
        return None
    
    def join_room(self, room_id: str, nickname: str) -> tuple[int, dict | None]:
        """방 참여"""
        response = requests.post(
            f"{API_URL}/{room_id}/join",
            json={"nickname": nickname}
        )
        return response.status_code, response.json() if response.ok else None
    
    def get_room(self, room_id: str, token: str | None = None) -> tuple[int, dict | None]:
        """방 조회"""
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        response = requests.get(f"{API_URL}/{room_id}", headers=headers)
        return response.status_code, response.json() if response.ok else None
    
    def start_voting(self, room_id: str, token: str) -> tuple[int, dict | None]:
        """투표 시작"""
        response = requests.post(
            f"{API_URL}/{room_id}/start",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.status_code, response.json() if response.ok else None
    
    def cast_vote(self, room_id: str, token: str, candidate_id: str) -> tuple[int, dict | None]:
        """투표"""
        response = requests.post(
            f"{API_URL}/{room_id}/vote",
            headers={"Authorization": f"Bearer {token}"},
            json={"candidate_id": candidate_id}
        )
        return response.status_code, response.json() if response.ok else None
    
    def change_vote(self, room_id: str, token: str, new_candidate_id: str) -> tuple[int, dict | None]:
        """투표 변경"""
        response = requests.patch(
            f"{API_URL}/{room_id}/vote",
            headers={"Authorization": f"Bearer {token}"},
            json={"new_candidate_id": new_candidate_id}
        )
        return response.status_code, response.json() if response.ok else None
    
    def close_room(self, room_id: str, token: str) -> tuple[int, dict | None]:
        """방 종료"""
        response = requests.post(
            f"{API_URL}/{room_id}/close",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.status_code, response.json() if response.ok else None
    
    # ===== 테스트 시나리오 =====
    
    def test_scenario_1_basic_flow(self):
        """시나리오 1: 기본 투표 흐름"""
        self._header("시나리오 1: 기본 투표 흐름")
        
        # 1. 방 생성
        self._subheader("1. 방 생성")
        room_data = self.create_room("점심 뭐먹지?", "김방장")
        if not room_data:
            self._fail("방 생성", "실패")
            return
        
        room_id = room_data["room_id"]
        host_token = room_data["token"]
        self._success("방 생성", f"room_id={room_id[:8]}...")
        
        # 2. 방 조회
        self._subheader("2. 방 조회")
        status, room = self.get_room(room_id)
        if status == 200:
            self._success("방 조회", f"status={room['room']['status']}")
        else:
            self._fail("방 조회", f"status_code={status}")
        
        # 3. 참여자 입장
        self._subheader("3. 참여자 입장")
        status, p1 = self.join_room(room_id, "철수")
        if status == 200:
            self._success("철수 입장")
        else:
            self._fail("철수 입장")
        
        status, p2 = self.join_room(room_id, "영희")
        if status == 200:
            self._success("영희 입장")
        else:
            self._fail("영희 입장")
        
        # 4. 투표 시작
        self._subheader("4. 투표 시작")
        status, _ = self.start_voting(room_id, host_token)
        if status == 200:
            self._success("투표 시작")
        else:
            self._fail("투표 시작", f"status_code={status}")
        
        # 5. 투표 진행
        self._subheader("5. 투표 진행")
        _, room = self.get_room(room_id)
        candidates = room["room"]["candidates"]
        jjajang_id = candidates[0]["id"]
        jjambbong_id = candidates[1]["id"]
        
        status, _ = self.cast_vote(room_id, host_token, jjajang_id)
        if status == 200:
            self._success("방장 투표 (짜장면)")
        else:
            self._fail("방장 투표")
        
        status, _ = self.cast_vote(room_id, p1["token"], jjajang_id)
        if status == 200:
            self._success("철수 투표 (짜장면)")
        else:
            self._fail("철수 투표")
        
        status, _ = self.cast_vote(room_id, p2["token"], jjambbong_id)
        if status == 200:
            self._success("영희 투표 (짬뽕)")
        else:
            self._fail("영희 투표")
        
        # 6. 투표 종료
        self._subheader("6. 투표 종료")
        status, result = self.close_room(room_id, host_token)
        if status == 200:
            winner = result.get("winner")
            if winner:
                self._success("투표 종료", f"우승: {winner['value']}")
            else:
                self._success("투표 종료", "동점 (우승자 없음)")
        else:
            self._fail("투표 종료", f"status_code={status}")
    
    def test_scenario_2_permission_denied(self):
        """시나리오 2: 권한 테스트"""
        self._header("시나리오 2: 권한 테스트 (비방장 시작/종료 시도)")
        
        # 방 생성 및 참여
        room_data = self.create_room()
        room_id = room_data["room_id"]
        host_token = room_data["token"]
        
        _, p1 = self.join_room(room_id, "일반참여자")
        participant_token = p1["token"]
        
        # 비방장이 투표 시작 시도
        self._subheader("1. 비방장이 투표 시작 시도")
        status, _ = self.start_voting(room_id, participant_token)
        if status == 403:
            self._success("권한 거부됨 (403)")
        else:
            self._fail("권한 거부 실패", f"expected 403, got {status}")
        
        # 방장이 투표 시작
        self.start_voting(room_id, host_token)
        
        # 비방장이 투표 종료 시도
        self._subheader("2. 비방장이 투표 종료 시도")
        status, _ = self.close_room(room_id, participant_token)
        if status == 403:
            self._success("권한 거부됨 (403)")
        else:
            self._fail("권한 거부 실패", f"expected 403, got {status}")
    
    def test_scenario_3_duplicate_vote(self):
        """시나리오 3: 중복 투표 테스트"""
        self._header("시나리오 3: 중복 투표 테스트")
        
        room_data = self.create_room()
        room_id = room_data["room_id"]
        host_token = room_data["token"]
        
        self.start_voting(room_id, host_token)
        
        _, room = self.get_room(room_id)
        candidate_id = room["room"]["candidates"][0]["id"]
        
        # 첫 번째 투표
        self._subheader("1. 첫 번째 투표")
        status, _ = self.cast_vote(room_id, host_token, candidate_id)
        if status == 200:
            self._success("첫 번째 투표 성공")
        else:
            self._fail("첫 번째 투표 실패")
        
        # 중복 투표 시도
        self._subheader("2. 중복 투표 시도")
        status, _ = self.cast_vote(room_id, host_token, candidate_id)
        if status == 409:
            self._success("중복 투표 거부됨 (409)")
        else:
            self._fail("중복 투표 거부 실패", f"expected 409, got {status}")
    
    def test_scenario_4_change_vote(self):
        """시나리오 4: 투표 변경 테스트"""
        self._header("시나리오 4: 투표 변경 테스트")
        
        room_data = self.create_room()
        room_id = room_data["room_id"]
        host_token = room_data["token"]
        
        self.start_voting(room_id, host_token)
        
        _, room = self.get_room(room_id)
        candidates = room["room"]["candidates"]
        first_id = candidates[0]["id"]
        second_id = candidates[1]["id"]
        
        # 첫 번째 투표
        self._subheader("1. 첫 번째 투표 (짜장면)")
        self.cast_vote(room_id, host_token, first_id)
        _, room = self.get_room(room_id, host_token)
        my_vote = room.get("my_vote")
        if my_vote == first_id:
            self._success("투표 완료", f"my_vote={first_id[:8]}...")
        else:
            self._fail("투표 확인 실패")
        
        # 투표 변경
        self._subheader("2. 투표 변경 (짬뽕)")
        status, result = self.change_vote(room_id, host_token, second_id)
        if status == 200:
            self._success("투표 변경 성공")
            # 결과 확인
            for r in result["results"]:
                if r["candidate"]["id"] == second_id:
                    if r["vote_count"] == 1:
                        self._success("변경된 후보 득표 확인", f"vote_count=1")
                    else:
                        self._fail("득표 확인 실패")
        else:
            self._fail("투표 변경 실패", f"status_code={status}")
    
    def test_scenario_5_nickname_duplicate(self):
        """시나리오 5: 닉네임 중복 테스트"""
        self._header("시나리오 5: 닉네임 중복 테스트")
        
        room_data = self.create_room()
        room_id = room_data["room_id"]
        
        # 첫 번째 참여
        self._subheader("1. 첫 번째 참여 (닉네임: 철수)")
        status, _ = self.join_room(room_id, "철수")
        if status == 200:
            self._success("철수 입장 성공")
        else:
            self._fail("철수 입장 실패")
        
        # 같은 닉네임으로 재참여 시도
        self._subheader("2. 같은 닉네임으로 재참여 시도")
        status, _ = self.join_room(room_id, "철수")
        if status == 409:
            self._success("닉네임 중복 거부됨 (409)")
        else:
            self._fail("닉네임 중복 거부 실패", f"expected 409, got {status}")
    
    def test_scenario_6_room_full(self):
        """시나리오 6: 정원 초과 테스트"""
        self._header("시나리오 6: 정원 초과 테스트")
        
        # 최대 2명 방 생성 (방장 포함)
        room_data = self.create_room(max_participants=2)
        room_id = room_data["room_id"]
        
        self._subheader("1. 참여자 입장 (정원 2명, 방장 포함)")
        
        # 1명 참여 (정원 도달)
        status, _ = self.join_room(room_id, "참여자1")
        if status == 200:
            self._success("참여자1 입장 (2/2)")
        else:
            self._fail("참여자1 입장 실패")
        
        # 추가 참여 시도
        self._subheader("2. 정원 초과 시도")
        status, _ = self.join_room(room_id, "참여자2")
        if status == 409:
            self._success("정원 초과 거부됨 (409)")
        else:
            self._fail("정원 초과 거부 실패", f"expected 409, got {status}")
    
    def test_scenario_7_no_auth(self):
        """시나리오 7: 인증 없이 접근 테스트"""
        self._header("시나리오 7: 인증 없이 접근 테스트")
        
        room_data = self.create_room()
        room_id = room_data["room_id"]
        host_token = room_data["token"]
        
        self.start_voting(room_id, host_token)
        
        _, room = self.get_room(room_id)
        candidate_id = room["room"]["candidates"][0]["id"]
        
        # 토큰 없이 투표 시도
        self._subheader("1. 토큰 없이 투표 시도")
        response = requests.post(
            f"{API_URL}/{room_id}/vote",
            json={"candidate_id": candidate_id}
        )
        if response.status_code == 401:
            self._success("인증 필요 (401)")
        else:
            self._fail("인증 체크 실패", f"expected 401, got {response.status_code}")
        
        # 토큰 없이 시작 시도
        self._subheader("2. 토큰 없이 투표 시작 시도")
        response = requests.post(f"{API_URL}/{room_id}/start")
        if response.status_code == 401:
            self._success("인증 필요 (401)")
        else:
            self._fail("인증 체크 실패", f"expected 401, got {response.status_code}")
    
    def test_scenario_8_wrong_room_token(self):
        """시나리오 8: 다른 방 토큰으로 접근 테스트"""
        self._header("시나리오 8: 다른 방 토큰으로 접근 테스트")
        
        # 방 A 생성
        room_a = self.create_room("방 A", "방장A")
        room_a_id = room_a["room_id"]
        token_a = room_a["token"]
        
        # 방 B 생성
        room_b = self.create_room("방 B", "방장B")
        room_b_id = room_b["room_id"]
        
        self.start_voting(room_b_id, room_b["token"])
        
        # 방 A 토큰으로 방 B에서 투표 시도
        self._subheader("1. 방 A 토큰으로 방 B 투표 시작 시도")
        status, _ = self.start_voting(room_b_id, token_a)
        if status == 403:
            self._success("방 불일치 거부됨 (403)")
        else:
            self._fail("방 불일치 체크 실패", f"expected 403, got {status}")
    
    def test_scenario_9_vote_before_start(self):
        """시나리오 9: 투표 시작 전 투표 시도"""
        self._header("시나리오 9: 투표 시작 전 투표 시도")
        
        room_data = self.create_room()
        room_id = room_data["room_id"]
        host_token = room_data["token"]
        
        _, room = self.get_room(room_id)
        candidate_id = room["room"]["candidates"][0]["id"]
        
        # 투표 시작 전 투표 시도
        self._subheader("1. 투표 시작 전 투표 시도")
        status, _ = self.cast_vote(room_id, host_token, candidate_id)
        if status == 400:
            self._success("투표 불가 (400)")
        else:
            self._fail("상태 체크 실패", f"expected 400, got {status}")
    
    def test_scenario_10_tie_vote(self):
        """시나리오 10: 동점 투표 테스트"""
        self._header("시나리오 10: 동점 투표 테스트")
        
        room_data = self.create_room()
        room_id = room_data["room_id"]
        host_token = room_data["token"]
        
        _, p1 = self.join_room(room_id, "철수")
        
        self.start_voting(room_id, host_token)
        
        _, room = self.get_room(room_id)
        candidates = room["room"]["candidates"]
        
        # 동점 투표
        self._subheader("1. 동점 투표 (각 1표)")
        self.cast_vote(room_id, host_token, candidates[0]["id"])
        self.cast_vote(room_id, p1["token"], candidates[1]["id"])
        self._success("투표 완료 (짜장면: 1, 짬뽕: 1)")
        
        # 종료
        self._subheader("2. 투표 종료 (동점 처리)")
        status, result = self.close_room(room_id, host_token)
        if status == 200 and result.get("winner") is None:
            self._success("동점 처리됨 (winner=null)")
        else:
            winner = result.get("winner", {}).get("value") if result else None
            self._fail("동점 처리 실패", f"winner={winner}")
    
    def run_all_tests(self):
        """모든 테스트 실행"""
        print("\n" + "="*60)
        print("  🧪 Room API 통합 테스트 시작")
        print("="*60)
        
        try:
            # 서버 연결 확인 (루트 엔드포인트 또는 docs)
            response = requests.get(f"{BASE_URL}/docs", timeout=3)
            # 200이 아니어도 연결만 되면 OK
        except requests.ConnectionError:
            print(f"\n❌ 서버에 연결할 수 없습니다. {BASE_URL}")
            print("   서버를 먼저 실행해주세요: uvicorn main:app --reload")
            return
        except requests.Timeout:
            print(f"\n❌ 서버 응답 시간 초과. {BASE_URL}")
            return
        
        # 모든 시나리오 실행
        self.test_scenario_1_basic_flow()
        self.test_scenario_2_permission_denied()
        self.test_scenario_3_duplicate_vote()
        self.test_scenario_4_change_vote()
        self.test_scenario_5_nickname_duplicate()
        self.test_scenario_6_room_full()
        self.test_scenario_7_no_auth()
        self.test_scenario_8_wrong_room_token()
        self.test_scenario_9_vote_before_start()
        self.test_scenario_10_tie_vote()
        
        # 결과 요약
        return self._print_summary()
    
    def _print_summary(self):
        """테스트 결과 요약"""
        print("\n" + "="*60)
        print("  📊 테스트 결과 요약")
        print("="*60)
        
        passed = sum(1 for r in self.results if r.passed)
        failed = sum(1 for r in self.results if not r.passed)
        total = len(self.results)
        
        print(f"\n  ✅ 성공: {passed}")
        print(f"  ❌ 실패: {failed}")
        print(f"  📝 총계: {total}")
        
        if failed > 0:
            print("\n  실패한 테스트:")
            for r in self.results:
                if not r.passed:
                    print(f"    - {r.name}: {r.message}")
        
        print("\n" + "="*60)
        
        if failed == 0:
            print("  🎉 모든 테스트 통과!")
        else:
            print(f"  ⚠️  {failed}개의 테스트 실패")
        print("="*60 + "\n")
        
        return failed == 0


if __name__ == "__main__":
    tester = RoomAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
