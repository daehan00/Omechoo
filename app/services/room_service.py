"""투표 방 비즈니스 로직 서비스"""
from datetime import datetime, timedelta
from uuid import uuid4

from app.domain.entities.room import (
    Room,
    Participant,
    Vote,
    VoteResult,
    Candidate,
    RoomStatus,
    CandidateType,
)
from app.domain.interfaces.room import (
    RoomRepository,
    ParticipantRepository,
    VoteRepository,
)
from app.core.exceptions import (
    RoomNotFoundError,
    RoomExpiredError,
    RoomFullError,
    RoomNotVotingError,
    NicknameTakenError,
    AlreadyVotedError,
    InvalidCandidateError,
    ParticipantNotFoundError,
)
from app.schemas.requests.room import (
    CreateRoomRequest,
    JoinRoomRequest,
)


class RoomService:
    """투표 방 서비스"""
    
    def __init__(
        self,
        room_repo: RoomRepository,
        participant_repo: ParticipantRepository,
        vote_repo: VoteRepository,
    ):
        self._room_repo = room_repo
        self._participant_repo = participant_repo
        self._vote_repo = vote_repo
    
    async def create_room(self, request: CreateRoomRequest) -> tuple[Room, Participant]:
        """방 생성 및 방장 참여자 생성
        
        Returns:
            tuple[Room, Participant]: 생성된 방과 방장 정보
        """
        room_id = str(uuid4())
        host_id = str(uuid4())
        
        # 후보 목록 생성
        candidates = [
            Candidate(
                id=str(uuid4()),
                value=c.value,
                display_name=c.display_name,
            )
            for c in request.candidates
        ]
        
        # 만료 시간 계산
        expires_at = None
        if request.expires_in_minutes:
            expires_at = datetime.now() + timedelta(minutes=request.expires_in_minutes)
        
        # 방 생성
        room = Room(
            id=room_id,
            name=request.name,
            host_id=host_id,
            candidate_type=request.candidate_type,
            candidates=candidates,
            status=RoomStatus.WAITING,
            max_participants=request.max_participants,
            expires_at=expires_at,
        )
        created_room = self._room_repo.create(room)
        
        # 방장을 참여자로 등록
        host = Participant(
            id=host_id,
            room_id=room_id,
            nickname=request.host_nickname,
            is_host=True,
        )
        created_host = self._participant_repo.add(host)
        
        return created_room, created_host
    
    async def get_room(self, room_id: str) -> Room:
        """방 조회"""
        room = self._room_repo.get_by_id(room_id)
        if not room:
            raise RoomNotFoundError(room_id)
        return room
    
    async def get_room_detail(
        self, room_id: str, participant_id: str | None = None
    ) -> tuple[Room, list[Participant], list[VoteResult], str | None]:
        """방 상세 정보 조회
        
        Returns:
            tuple: (방 정보, 참여자 목록, 투표 결과, 내 투표 후보 ID)
        """
        room = await self.get_room(room_id)
        participants = self._participant_repo.get_by_room_id(room_id)
        results = self._vote_repo.get_results(room_id)
        
        my_vote = None
        if participant_id:
            vote = self._vote_repo.get_by_participant(room_id, participant_id)
            if vote:
                my_vote = vote.candidate_id
        
        return room, participants, results, my_vote
    
    async def join_room(self, room_id: str, request: JoinRoomRequest) -> Participant:
        """방 참여"""
        room = await self.get_room(room_id)
        
        # 만료 확인
        if room.is_expired():
            raise RoomExpiredError(room_id)
        
        # 정원 확인
        current_count = self._participant_repo.count_by_room_id(room_id)
        if current_count >= room.max_participants:
            raise RoomFullError(room_id, room.max_participants)
        
        # 닉네임 중복 확인
        existing = self._participant_repo.get_by_room_and_nickname(
            room_id, request.nickname
        )
        if existing:
            raise NicknameTakenError(request.nickname)
        
        # 참여자 생성
        participant = Participant(
            id=str(uuid4()),
            room_id=room_id,
            nickname=request.nickname,
            is_host=False,
        )
        return self._participant_repo.add(participant)
    
    async def start_voting(self, room_id: str) -> Room:
        """투표 시작 (방장 검증은 라우트에서 토큰으로 수행)"""
        room = await self.get_room(room_id)
        
        # 상태 변경
        updated = self._room_repo.update_status(room_id, RoomStatus.VOTING)
        if not updated:
            raise RoomNotFoundError(room_id)
        return updated
    
    async def cast_vote(self, room_id: str, participant_id: str, candidate_id: str) -> list[VoteResult]:
        """투표하기"""
        room = await self.get_room(room_id)
        
        # 투표 가능 상태 확인
        if not room.can_vote():
            raise RoomNotVotingError(room_id, room.status.value)
        
        # 참여자 확인
        participant = self._participant_repo.get_by_id(participant_id)
        if not participant or participant.room_id != room_id:
            raise ParticipantNotFoundError(participant_id)
        
        # 후보 유효성 확인
        valid_candidate_ids = [c.id for c in room.candidates]
        if candidate_id not in valid_candidate_ids:
            raise InvalidCandidateError(candidate_id)
        
        # 중복 투표 확인
        existing_vote = self._vote_repo.get_by_participant(room_id, participant_id)
        if existing_vote:
            raise AlreadyVotedError(participant_id)
        
        # 투표 생성
        vote = Vote(
            id=str(uuid4()),
            room_id=room_id,
            participant_id=participant_id,
            candidate_id=candidate_id,
        )
        self._vote_repo.cast(vote)
        
        return self._vote_repo.get_results(room_id)
    
    async def change_vote(self, room_id: str, participant_id: str, new_candidate_id: str | None) -> list[VoteResult]:
        """투표 변경 또는 취소
        
        Args:
            new_candidate_id: 새 후보 ID. None이면 투표 취소.
        """
        room = await self.get_room(room_id)
        
        # 투표 가능 상태 확인
        if not room.can_vote():
            raise RoomNotVotingError(room_id, room.status.value)
        
        # new_candidate_id가 None이면 투표 취소
        if new_candidate_id is None:
            deleted = self._vote_repo.delete_vote(room_id, participant_id)
            if not deleted:
                raise ParticipantNotFoundError(participant_id)
            return self._vote_repo.get_results(room_id)
        
        # 후보 유효성 확인
        valid_candidate_ids = [c.id for c in room.candidates]
        if new_candidate_id not in valid_candidate_ids:
            raise InvalidCandidateError(new_candidate_id)
        
        # 기존 투표 확인 및 변경
        updated = self._vote_repo.update_vote(
            room_id, participant_id, new_candidate_id
        )
        if not updated:
            raise ParticipantNotFoundError(participant_id)
        
        return self._vote_repo.get_results(room_id)
    
    async def close_room(
        self, room_id: str
    ) -> tuple[list[VoteResult], Candidate | None]:
        """방 종료 (방장 검증은 라우트에서 토큰으로 수행)
        
        Returns:
            tuple: (최종 결과, 우승 후보 또는 None)
        """
        room = await self.get_room(room_id)
        
        # 상태 변경
        self._room_repo.update_status(room_id, RoomStatus.CLOSED)
        
        # 최종 결과 조회
        results = self._vote_repo.get_results(room_id)
        
        # 우승자 결정 (동점이면 None)
        winner = None
        if results and len(results) >= 1:
            if len(results) == 1 or results[0].vote_count > results[1].vote_count:
                winner = results[0].candidate
        
        return results, winner
    
    async def get_participant(self, participant_id: str) -> Participant:
        """참여자 조회"""
        participant = self._participant_repo.get_by_id(participant_id)
        if not participant:
            raise ParticipantNotFoundError(participant_id)
        return participant
    
    async def get_participant_count(self, room_id: str) -> int:
        """방 참여자 수"""
        return self._participant_repo.count_by_room_id(room_id)
