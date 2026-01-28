"""Room 관련 테스트용 Mock Repository"""
from datetime import datetime
from collections import defaultdict
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


class MockRoomRepository(RoomRepository):
    """테스트용 Room Mock Repository"""
    
    def __init__(self):
        self._rooms: dict[str, Room] = {}
    
    def create(self, room: Room) -> Room:
        self._rooms[room.id] = room
        return room
    
    def get_by_id(self, room_id: str) -> Room | None:
        return self._rooms.get(room_id)
    
    def update_status(self, room_id: str, status: RoomStatus) -> Room | None:
        room = self._rooms.get(room_id)
        if room:
            # dataclass는 frozen이 아니므로 직접 수정
            room.status = status
            return room
        return None
    
    def delete(self, room_id: str) -> bool:
        if room_id in self._rooms:
            del self._rooms[room_id]
            return True
        return False
    
    def get_expired_rooms(self) -> list[Room]:
        now = datetime.now()
        return [
            r for r in self._rooms.values()
            if r.expires_at and r.expires_at < now and r.status != RoomStatus.CLOSED
        ]


class MockParticipantRepository(ParticipantRepository):
    """테스트용 Participant Mock Repository"""
    
    def __init__(self):
        self._participants: dict[str, Participant] = {}
    
    def add(self, participant: Participant) -> Participant:
        self._participants[participant.id] = participant
        return participant
    
    def get_by_id(self, participant_id: str) -> Participant | None:
        return self._participants.get(participant_id)
    
    def get_by_room_id(self, room_id: str) -> list[Participant]:
        return [p for p in self._participants.values() if p.room_id == room_id]
    
    def get_by_room_and_nickname(
        self, room_id: str, nickname: str
    ) -> Participant | None:
        for p in self._participants.values():
            if p.room_id == room_id and p.nickname == nickname:
                return p
        return None
    
    def count_by_room_id(self, room_id: str) -> int:
        return len([p for p in self._participants.values() if p.room_id == room_id])
    
    def remove(self, participant_id: str) -> bool:
        if participant_id in self._participants:
            del self._participants[participant_id]
            return True
        return False


class MockVoteRepository(VoteRepository):
    """테스트용 Vote Mock Repository"""
    
    def __init__(self, room_repo: MockRoomRepository, participant_repo: MockParticipantRepository):
        self._votes: dict[str, Vote] = {}
        self._room_repo = room_repo
        self._participant_repo = participant_repo
    
    def cast(self, vote: Vote) -> Vote:
        self._votes[vote.id] = vote
        return vote
    
    def get_by_participant(
        self, room_id: str, participant_id: str
    ) -> Vote | None:
        for v in self._votes.values():
            if v.room_id == room_id and v.participant_id == participant_id:
                return v
        return None
    
    def update_vote(
        self, room_id: str, participant_id: str, new_candidate_id: str
    ) -> Vote | None:
        for v in self._votes.values():
            if v.room_id == room_id and v.participant_id == participant_id:
                v.candidate_id = new_candidate_id
                v.voted_at = datetime.now()
                return v
        return None
    
    def get_results(self, room_id: str) -> list[VoteResult]:
        room = self._room_repo.get_by_id(room_id)
        if not room:
            return []
        
        # 참여자 닉네임 맵핑
        participants = self._participant_repo.get_by_room_id(room_id)
        participant_map = {p.id: p.nickname for p in participants}
        
        # 후보별 투표 집계
        vote_by_candidate: dict[str, list[str]] = defaultdict(list)
        for v in self._votes.values():
            if v.room_id == room_id:
                voter_nickname = participant_map.get(v.participant_id, "Unknown")
                vote_by_candidate[v.candidate_id].append(voter_nickname)
        
        results = []
        for c in room.candidates:
            voters = vote_by_candidate.get(c.id, [])
            results.append(VoteResult(
                candidate=c,
                vote_count=len(voters),
                voters=voters,
            ))
        
        results.sort(key=lambda r: r.vote_count, reverse=True)
        return results
    
    def get_vote_count(self, room_id: str) -> int:
        return len([v for v in self._votes.values() if v.room_id == room_id])
