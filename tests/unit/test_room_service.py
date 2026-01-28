"""RoomService 유닛 테스트 (비동기, JWT 인증 버전)"""
import pytest
from datetime import datetime, timedelta

from app.domain.entities.room import (
    Room,
    Participant,
    Vote,
    Candidate,
    RoomStatus,
    CandidateType,
)
from app.services.room_service import RoomService
from app.schemas.requests.room import (
    CreateRoomRequest,
    JoinRoomRequest,
    CandidateInput,
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
from tests.fixtures.mock_room_repos import (
    MockRoomRepository,
    MockParticipantRepository,
    MockVoteRepository,
)


@pytest.fixture
def room_repos():
    room_repo = MockRoomRepository()
    participant_repo = MockParticipantRepository()
    vote_repo = MockVoteRepository(room_repo, participant_repo)
    return room_repo, participant_repo, vote_repo


@pytest.fixture
def room_service(room_repos):
    room_repo, participant_repo, vote_repo = room_repos
    return RoomService(room_repo, participant_repo, vote_repo)


@pytest.fixture
def sample_create_request():
    return CreateRoomRequest(
        name="점심 뭐먹지?",
        host_nickname="방장",
        candidate_type=CandidateType.MENU,
        candidates=[
            CandidateInput(value="짜장면", display_name=None),
            CandidateInput(value="짬뽕", display_name=None),
            CandidateInput(value="볶음밥", display_name=None),
        ],
        max_participants=5,
        expires_in_minutes=60,
    )


class TestCreateRoom:
    @pytest.mark.asyncio
    async def test_create_room_success(self, room_service, sample_create_request):
        room, host = await room_service.create_room(sample_create_request)
        assert room.id is not None
        assert room.name == "점심 뭐먹지?"
        assert room.status == RoomStatus.WAITING
        assert len(room.candidates) == 3
        assert host.is_host is True

    @pytest.mark.asyncio
    async def test_create_room_with_restaurant_type(self, room_service):
        request = CreateRoomRequest(
            name="맛집 투표",
            host_nickname="host",
            candidate_type=CandidateType.RESTAURANT,
            candidates=[
                CandidateInput(value="https://place.map.kakao.com/12345", display_name="맛집A"),
                CandidateInput(value="https://place.map.kakao.com/67890", display_name="맛집B"),
            ],
        )
        room, host = await room_service.create_room(request)
        assert room.candidate_type == CandidateType.RESTAURANT


class TestGetRoom:
    @pytest.mark.asyncio
    async def test_get_room_success(self, room_service, sample_create_request):
        room, _ = await room_service.create_room(sample_create_request)
        fetched = await room_service.get_room(room.id)
        assert fetched.id == room.id

    @pytest.mark.asyncio
    async def test_get_room_not_found(self, room_service):
        with pytest.raises(RoomNotFoundError):
            await room_service.get_room("non-existent-id")

    @pytest.mark.asyncio
    async def test_get_room_detail(self, room_service, sample_create_request):
        room, host = await room_service.create_room(sample_create_request)
        room_detail, participants, results, my_vote = await room_service.get_room_detail(room.id, host.id)
        assert room_detail.id == room.id
        assert len(participants) == 1


class TestJoinRoom:
    @pytest.mark.asyncio
    async def test_join_room_success(self, room_service, sample_create_request):
        room, _ = await room_service.create_room(sample_create_request)
        participant = await room_service.join_room(room.id, JoinRoomRequest(nickname="참여자1"))
        assert participant.nickname == "참여자1"
        assert participant.is_host is False

    @pytest.mark.asyncio
    async def test_join_room_nickname_taken(self, room_service, sample_create_request):
        room, _ = await room_service.create_room(sample_create_request)
        await room_service.join_room(room.id, JoinRoomRequest(nickname="참여자"))
        with pytest.raises(NicknameTakenError):
            await room_service.join_room(room.id, JoinRoomRequest(nickname="참여자"))

    @pytest.mark.asyncio
    async def test_join_room_full(self, room_service, sample_create_request):
        sample_create_request.max_participants = 2
        room, _ = await room_service.create_room(sample_create_request)
        await room_service.join_room(room.id, JoinRoomRequest(nickname="참여자1"))
        with pytest.raises(RoomFullError):
            await room_service.join_room(room.id, JoinRoomRequest(nickname="참여자2"))

    @pytest.mark.asyncio
    async def test_join_room_not_found(self, room_service):
        with pytest.raises(RoomNotFoundError):
            await room_service.join_room("non-existent", JoinRoomRequest(nickname="test"))


class TestStartVoting:
    @pytest.mark.asyncio
    async def test_start_voting_success(self, room_service, sample_create_request):
        room, host = await room_service.create_room(sample_create_request)
        updated = await room_service.start_voting(room.id)
        assert updated.status == RoomStatus.VOTING


class TestCastVote:
    @pytest.mark.asyncio
    async def test_cast_vote_success(self, room_service, sample_create_request):
        room, host = await room_service.create_room(sample_create_request)
        await room_service.start_voting(room.id)
        candidate_id = room.candidates[0].id
        results = await room_service.cast_vote(room.id, host.id, candidate_id)
        assert results[0].vote_count == 1

    @pytest.mark.asyncio
    async def test_cast_vote_not_voting_status(self, room_service, sample_create_request):
        room, host = await room_service.create_room(sample_create_request)
        with pytest.raises(RoomNotVotingError):
            await room_service.cast_vote(room.id, host.id, room.candidates[0].id)

    @pytest.mark.asyncio
    async def test_cast_vote_invalid_candidate(self, room_service, sample_create_request):
        room, host = await room_service.create_room(sample_create_request)
        await room_service.start_voting(room.id)
        with pytest.raises(InvalidCandidateError):
            await room_service.cast_vote(room.id, host.id, "invalid-id")

    @pytest.mark.asyncio
    async def test_cast_vote_already_voted(self, room_service, sample_create_request):
        room, host = await room_service.create_room(sample_create_request)
        await room_service.start_voting(room.id)
        candidate_id = room.candidates[0].id
        await room_service.cast_vote(room.id, host.id, candidate_id)
        with pytest.raises(AlreadyVotedError):
            await room_service.cast_vote(room.id, host.id, candidate_id)


class TestChangeVote:
    @pytest.mark.asyncio
    async def test_change_vote_success(self, room_service, sample_create_request):
        room, host = await room_service.create_room(sample_create_request)
        await room_service.start_voting(room.id)
        first_candidate = room.candidates[0].id
        await room_service.cast_vote(room.id, host.id, first_candidate)
        second_candidate = room.candidates[1].id
        results = await room_service.change_vote(room.id, host.id, second_candidate)
        second_result = next(r for r in results if r.candidate.id == second_candidate)
        assert second_result.vote_count == 1
        first_result = next(r for r in results if r.candidate.id == first_candidate)
        assert first_result.vote_count == 0


class TestCloseRoom:
    @pytest.mark.asyncio
    async def test_close_room_success(self, room_service, sample_create_request):
        room, host = await room_service.create_room(sample_create_request)
        await room_service.start_voting(room.id)
        await room_service.cast_vote(room.id, host.id, room.candidates[0].id)
        results, winner = await room_service.close_room(room.id)
        assert winner is not None
        closed_room = await room_service.get_room(room.id)
        assert closed_room.status == RoomStatus.CLOSED

    @pytest.mark.asyncio
    async def test_close_room_tie(self, room_service, sample_create_request):
        room, host = await room_service.create_room(sample_create_request)
        await room_service.start_voting(room.id)
        p2 = await room_service.join_room(room.id, JoinRoomRequest(nickname="참여자2"))
        await room_service.cast_vote(room.id, host.id, room.candidates[0].id)
        await room_service.cast_vote(room.id, p2.id, room.candidates[1].id)
        results, winner = await room_service.close_room(room.id)
        assert winner is None


class TestRoomFlowScenario:
    @pytest.mark.asyncio
    async def test_full_voting_flow(self, room_service, sample_create_request):
        # 1. 방 생성
        room, host = await room_service.create_room(sample_create_request)
        assert room.status == RoomStatus.WAITING

        # 2. 참여자 입장
        p2 = await room_service.join_room(room.id, JoinRoomRequest(nickname="철수"))
        p3 = await room_service.join_room(room.id, JoinRoomRequest(nickname="영희"))
        assert await room_service.get_participant_count(room.id) == 3

        # 3. 투표 시작
        await room_service.start_voting(room.id)

        # 4. 투표 진행
        jjajang_id = room.candidates[0].id
        jjambbong_id = room.candidates[1].id
        await room_service.cast_vote(room.id, host.id, jjajang_id)
        await room_service.cast_vote(room.id, p2.id, jjajang_id)
        await room_service.cast_vote(room.id, p3.id, jjambbong_id)

        # 5. 투표 종료
        results, winner = await room_service.close_room(room.id)
        assert winner is not None
        assert winner.value == "짜장면"
        assert results[0].vote_count == 2
