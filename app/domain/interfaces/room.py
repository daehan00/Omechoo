"""투표 방 관련 인터페이스 (Repository Pattern)"""
from abc import ABC, abstractmethod
from app.domain.entities.room import (
    Room,
    Participant,
    Vote,
    VoteResult,
    RoomStatus,
)


class RoomRepository(ABC):
    """방 저장소 인터페이스"""
    
    @abstractmethod
    def create(self, room: Room) -> Room:
        """방 생성"""
        ...
    
    @abstractmethod
    def get_by_id(self, room_id: str) -> Room | None:
        """ID로 방 조회"""
        ...
    
    @abstractmethod
    def update_status(self, room_id: str, status: RoomStatus) -> Room | None:
        """방 상태 변경"""
        ...
    
    @abstractmethod
    def delete(self, room_id: str) -> bool:
        """방 삭제"""
        ...
    
    @abstractmethod
    def get_expired_rooms(self) -> list[Room]:
        """만료된 방 목록 조회"""
        ...


class ParticipantRepository(ABC):
    """참여자 저장소 인터페이스"""
    
    @abstractmethod
    def add(self, participant: Participant) -> Participant:
        """참여자 추가"""
        ...
    
    @abstractmethod
    def get_by_id(self, participant_id: str) -> Participant | None:
        """ID로 참여자 조회"""
        ...
    
    @abstractmethod
    def get_by_room_id(self, room_id: str) -> list[Participant]:
        """방의 모든 참여자 조회"""
        ...
    
    @abstractmethod
    def get_by_room_and_nickname(
        self, room_id: str, nickname: str
    ) -> Participant | None:
        """방에서 닉네임으로 참여자 조회 (중복 체크용)"""
        ...
    
    @abstractmethod
    def count_by_room_id(self, room_id: str) -> int:
        """방의 참여자 수"""
        ...
    
    @abstractmethod
    def remove(self, participant_id: str) -> bool:
        """참여자 제거"""
        ...


class VoteRepository(ABC):
    """투표 저장소 인터페이스"""
    
    @abstractmethod
    def cast(self, vote: Vote) -> Vote:
        """투표하기"""
        ...
    
    @abstractmethod
    def get_by_participant(
        self, room_id: str, participant_id: str
    ) -> Vote | None:
        """참여자의 투표 조회 (중복 투표 방지용)"""
        ...
    
    @abstractmethod
    def update_vote(
        self, room_id: str, participant_id: str, new_candidate_id: str
    ) -> Vote | None:
        """투표 변경"""
        ...
    
    @abstractmethod
    def delete_vote(
        self, room_id: str, participant_id: str
    ) -> bool:
        """투표 취소 (삭제)"""
        ...
    
    @abstractmethod
    def get_results(self, room_id: str) -> list[VoteResult]:
        """투표 결과 집계"""
        ...
    
    @abstractmethod
    def get_vote_count(self, room_id: str) -> int:
        """총 투표 수"""
        ...
