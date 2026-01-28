"""Room 도메인 엔티티 유닛 테스트"""
import pytest
from datetime import datetime, timedelta

from app.domain.entities.room import (
    Room,
    Participant,
    Vote,
    VoteResult,
    Candidate,
    RoomStatus,
    CandidateType,
)


class TestRoomEntity:
    """Room 엔티티 테스트"""
    
    @pytest.fixture
    def sample_candidates(self):
        return [
            Candidate(id="c1", value="짜장면", display_name=None),
            Candidate(id="c2", value="짬뽕", display_name=None),
        ]
    
    @pytest.fixture
    def sample_room(self, sample_candidates):
        return Room(
            id="room-1",
            name="점심 투표",
            host_id="host-1",
            candidate_type=CandidateType.MENU,
            candidates=sample_candidates,
            status=RoomStatus.WAITING,
            max_participants=10,
        )
    
    def test_room_creation(self, sample_room):
        """Room 생성 테스트"""
        assert sample_room.id == "room-1"
        assert sample_room.name == "점심 투표"
        assert sample_room.status == RoomStatus.WAITING
        assert len(sample_room.candidates) == 2
    
    def test_room_is_expired_false(self, sample_room):
        """만료되지 않은 방"""
        sample_room.expires_at = datetime.now() + timedelta(hours=1)
        assert sample_room.is_expired() is False
    
    def test_room_is_expired_true(self, sample_room):
        """만료된 방"""
        sample_room.expires_at = datetime.now() - timedelta(hours=1)
        assert sample_room.is_expired() is True
    
    def test_room_is_expired_no_expiry(self, sample_room):
        """만료 시간 없는 방"""
        sample_room.expires_at = None
        assert sample_room.is_expired() is False
    
    def test_room_can_vote_true(self, sample_room):
        """투표 가능 상태"""
        sample_room.status = RoomStatus.VOTING
        sample_room.expires_at = datetime.now() + timedelta(hours=1)
        assert sample_room.can_vote() is True
    
    def test_room_can_vote_false_wrong_status(self, sample_room):
        """대기 상태에서 투표 불가"""
        sample_room.status = RoomStatus.WAITING
        assert sample_room.can_vote() is False
    
    def test_room_can_vote_false_expired(self, sample_room):
        """만료된 방에서 투표 불가"""
        sample_room.status = RoomStatus.VOTING
        sample_room.expires_at = datetime.now() - timedelta(hours=1)
        assert sample_room.can_vote() is False


class TestCandidateType:
    """CandidateType Enum 테스트"""
    
    def test_menu_type(self):
        assert CandidateType.MENU.value == "menu"
    
    def test_restaurant_type(self):
        assert CandidateType.RESTAURANT.value == "restaurant"


class TestRoomStatus:
    """RoomStatus Enum 테스트"""
    
    def test_all_statuses(self):
        assert RoomStatus.WAITING.value == "waiting"
        assert RoomStatus.VOTING.value == "voting"
        assert RoomStatus.CLOSED.value == "closed"


class TestParticipantEntity:
    """Participant 엔티티 테스트"""
    
    def test_participant_creation(self):
        participant = Participant(
            id="p1",
            room_id="room-1",
            nickname="테스터",
            is_host=True,
        )
        
        assert participant.id == "p1"
        assert participant.room_id == "room-1"
        assert participant.nickname == "테스터"
        assert participant.is_host is True
    
    def test_participant_default_values(self):
        participant = Participant(
            id="p2",
            room_id="room-1",
            nickname="일반참여자",
        )
        
        assert participant.is_host is False
        assert participant.joined_at is not None


class TestVoteEntity:
    """Vote 엔티티 테스트"""
    
    def test_vote_creation(self):
        vote = Vote(
            id="v1",
            room_id="room-1",
            participant_id="p1",
            candidate_id="c1",
        )
        
        assert vote.id == "v1"
        assert vote.room_id == "room-1"
        assert vote.participant_id == "p1"
        assert vote.candidate_id == "c1"
        assert vote.voted_at is not None


class TestVoteResult:
    """VoteResult 테스트"""
    
    def test_vote_result_creation(self):
        candidate = Candidate(id="c1", value="짜장면", display_name=None)
        result = VoteResult(
            candidate=candidate,
            vote_count=3,
            voters=["철수", "영희", "민수"],
        )
        
        assert result.candidate.value == "짜장면"
        assert result.vote_count == 3
        assert len(result.voters) == 3
