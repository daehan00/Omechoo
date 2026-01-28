"""투표 방 관련 도메인 엔티티"""
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum


class RoomStatus(str, Enum):
    """방 상태"""
    WAITING = "waiting"    # 대기 중 (참여자 모집)
    VOTING = "voting"      # 투표 진행 중
    CLOSED = "closed"      # 투표 종료


class CandidateType(str, Enum):
    """후보 타입"""
    MENU = "menu"          # 메뉴명 리스트
    RESTAURANT = "restaurant"  # 식당 URL 리스트


@dataclass
class Candidate:
    """투표 후보"""
    id: str                     # UUID
    value: str                  # 메뉴명 또는 식당 URL
    display_name: str | None = None  # 표시용 이름 (식당의 경우 가게명)


@dataclass
class Room:
    """투표 방 엔티티"""
    id: str                              # UUID (공유 링크용)
    name: str                            # 방 제목 (예: "점심 뭐먹지?")
    host_id: str                         # 방장 participant_id
    candidate_type: CandidateType        # 메뉴 or 식당
    candidates: list[Candidate]          # 투표 후보 목록
    status: RoomStatus = RoomStatus.WAITING
    max_participants: int = 10           # 최대 참여자 수
    expires_at: datetime | None = None   # 만료 시간 (None이면 무제한)
    created_at: datetime = field(default_factory=datetime.now)
    
    def is_expired(self) -> bool:
        """만료 여부 확인"""
        if self.expires_at is None:
            return False
        return datetime.now() > self.expires_at
    
    def can_vote(self) -> bool:
        """투표 가능 여부"""
        return self.status == RoomStatus.VOTING and not self.is_expired()


@dataclass
class Participant:
    """방 참여자"""
    id: str                   # UUID
    room_id: str
    nickname: str
    is_host: bool = False
    joined_at: datetime = field(default_factory=datetime.now)


@dataclass
class Vote:
    """투표"""
    id: str                   # UUID
    room_id: str
    participant_id: str
    candidate_id: str         # 선택한 후보의 ID
    voted_at: datetime = field(default_factory=datetime.now)


@dataclass
class VoteResult:
    """투표 결과"""
    candidate: Candidate
    vote_count: int
    voters: list[str]         # 투표한 참여자 닉네임 목록
