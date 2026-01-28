"""투표 방 API 라우트 (JWT 인증 적용)"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.services.room_service import RoomService
from app.api.dependencies import get_room_service
from app.core.auth import (
    TokenPayload,
    create_participant_token,
    get_current_participant,
    get_current_participant_optional,
    require_host,
    require_room_match,
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
    CastVoteRequest,
    ChangeVoteRequest,
)
from app.schemas.responses.room import (
    RoomResponse,
    RoomDetailResponse,
    JoinRoomResponse,
    CreateRoomResponse,
    VoteResponse,
    CloseRoomResponse,
    CandidateResponse,
    ParticipantResponse,
    VoteResultResponse,
)


router = APIRouter(prefix="/api/rooms", tags=["rooms"])


def _to_candidate_response(candidate) -> CandidateResponse:
    return CandidateResponse(
        id=candidate.id,
        value=candidate.value,
        display_name=candidate.display_name,
    )


def _to_room_response(room, participant_count: int) -> RoomResponse:
    return RoomResponse(
        id=room.id,
        name=room.name,
        candidate_type=room.candidate_type,
        candidates=[_to_candidate_response(c) for c in room.candidates],
        status=room.status,
        max_participants=room.max_participants,
        participant_count=participant_count,
        expires_at=room.expires_at,
        created_at=room.created_at,
    )


def _to_participant_response(participant) -> ParticipantResponse:
    return ParticipantResponse(
        nickname=participant.nickname,
        is_host=participant.is_host,
        joined_at=participant.joined_at,
    )


def _to_vote_result_response(result) -> VoteResultResponse:
    return VoteResultResponse(
        candidate=_to_candidate_response(result.candidate),
        vote_count=result.vote_count,
        voters=result.voters,
    )


@router.post("", response_model=CreateRoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(
    request: Request,
    body: CreateRoomRequest,
    service: RoomService = Depends(get_room_service),
):
    """
    투표 방 생성
    
    방장으로서 새 방을 생성합니다. JWT 토큰이 발급됩니다.
    
    - **name**: 방 제목
    - **host_nickname**: 방장 닉네임
    - **candidate_type**: 후보 타입 (menu/restaurant)
    - **candidates**: 후보 목록 (2~10개)
    - **max_participants**: 최대 참여자 수 (기본 10)
    - **expires_in_minutes**: 만료 시간 (분, 기본 30분)
    """
    room, host = await service.create_room(body)
    
    # JWT 토큰 발급 (방장)
    token = create_participant_token(
        room_id=room.id,
        participant_id=host.id,
        nickname=host.nickname,
        is_host=True,
    )
    
    # 공유 URL 생성
    base_url = str(request.base_url).rstrip("/")
    share_url = f"{base_url}/rooms/{room.id}"
    
    return CreateRoomResponse(
        room_id=room.id,
        share_url=share_url,
        token=token,
    )


@router.get("/{room_id}", response_model=RoomDetailResponse)
async def get_room(
    room_id: str,
    service: RoomService = Depends(get_room_service),
    current_user: TokenPayload | None = Depends(get_current_participant_optional),
):
    """
    방 상세 정보 조회
    
    토큰 없이도 조회 가능합니다. 토큰이 있으면 내 투표 정보도 함께 반환됩니다.
    """
    try:
        # 토큰이 있고 해당 방의 참여자인 경우에만 my_vote 조회
        participant_id = None
        if current_user and current_user.room_id == room_id:
            participant_id = current_user.participant_id
        
        room, participants, results, my_vote = await service.get_room_detail(
            room_id, participant_id
        )
    except RoomNotFoundError:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return RoomDetailResponse(
        room=_to_room_response(room, len(participants)),
        participants=[_to_participant_response(p) for p in participants],
        results=[_to_vote_result_response(r) for r in results],
        my_vote=my_vote,
    )


@router.post("/{room_id}/join", response_model=JoinRoomResponse)
async def join_room(
    room_id: str,
    body: JoinRoomRequest,
    service: RoomService = Depends(get_room_service),
):
    """
    방 참여
    
    닉네임으로 방에 참여합니다. JWT 토큰이 발급됩니다.
    
    - **nickname**: 닉네임 (방 내에서 고유해야 함)
    """
    try:
        participant = await service.join_room(room_id, body)
        room = await service.get_room(room_id)
        count = await service.get_participant_count(room_id)
    except RoomNotFoundError:
        raise HTTPException(status_code=404, detail="Room not found")
    except RoomExpiredError:
        raise HTTPException(status_code=410, detail="Room has expired")
    except RoomFullError as e:
        raise HTTPException(
            status_code=409, 
            detail=f"Room is full (max: {e.max_participants})"
        )
    except NicknameTakenError:
        raise HTTPException(status_code=409, detail="Nickname already taken")
    
    # JWT 토큰 발급
    token = create_participant_token(
        room_id=room_id,
        participant_id=participant.id,
        nickname=participant.nickname,
        is_host=False,
    )
    
    return JoinRoomResponse(
        token=token,
        nickname=participant.nickname,
        is_host=participant.is_host,
        room=_to_room_response(room, count),
    )


@router.post("/{room_id}/start", response_model=RoomResponse)
async def start_voting(
    room_id: str,
    service: RoomService = Depends(get_room_service),
    current_user: TokenPayload = Depends(get_current_participant),
):
    """
    투표 시작 (방장만 가능)
    
    🔒 **인증 필요**: Authorization: Bearer <token>
    """
    # 방 일치 검증
    require_room_match(current_user, room_id)
    # 방장 검증
    require_host(current_user)
    
    try:
        room = await service.start_voting(room_id)
        count = await service.get_participant_count(room_id)
    except RoomNotFoundError:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return _to_room_response(room, count)


@router.post("/{room_id}/vote", response_model=VoteResponse)
async def cast_vote(
    room_id: str,
    body: CastVoteRequest,
    service: RoomService = Depends(get_room_service),
    current_user: TokenPayload = Depends(get_current_participant),
):
    """
    투표하기
    
    🔒 **인증 필요**: Authorization: Bearer <token>
    
    - **candidate_id**: 선택한 후보 ID
    """
    # 방 일치 검증
    require_room_match(current_user, room_id)
    
    try:
        results = await service.cast_vote(
            room_id, 
            current_user.participant_id, 
            body.candidate_id
        )
    except RoomNotFoundError:
        raise HTTPException(status_code=404, detail="Room not found")
    except RoomNotVotingError as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Room is not in voting status: {e.current_status}"
        )
    except ParticipantNotFoundError:
        raise HTTPException(status_code=404, detail="Participant not found")
    except InvalidCandidateError:
        raise HTTPException(status_code=400, detail="Invalid candidate")
    except AlreadyVotedError:
        raise HTTPException(
            status_code=409, 
            detail="Already voted. Use PATCH to change vote."
        )
    
    return VoteResponse(
        success=True,
        message="Vote cast successfully",
        results=[_to_vote_result_response(r) for r in results],
    )


@router.patch("/{room_id}/vote", response_model=VoteResponse)
async def change_vote(
    room_id: str,
    body: ChangeVoteRequest,
    service: RoomService = Depends(get_room_service),
    current_user: TokenPayload = Depends(get_current_participant),
):
    """
    투표 변경 또는 취소
    
    🔒 **인증 필요**: Authorization: Bearer <token>
    
    - **new_candidate_id**: 새로 선택할 후보 ID (null이면 투표 취소)
    """
    # 방 일치 검증
    require_room_match(current_user, room_id)
    
    try:
        results = await service.change_vote(
            room_id,
            current_user.participant_id,
            body.new_candidate_id
        )
    except RoomNotFoundError:
        raise HTTPException(status_code=404, detail="Room not found")
    except RoomNotVotingError as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Room is not in voting status: {e.current_status}"
        )
    except InvalidCandidateError:
        raise HTTPException(status_code=400, detail="Invalid candidate")
    except ParticipantNotFoundError:
        raise HTTPException(status_code=404, detail="Vote not found")
    
    # 취소인지 변경인지에 따라 메시지 분기
    message = "Vote cancelled successfully" if body.new_candidate_id is None else "Vote changed successfully"
    
    return VoteResponse(
        success=True,
        message=message,
        results=[_to_vote_result_response(r) for r in results],
    )


@router.post("/{room_id}/close", response_model=CloseRoomResponse)
async def close_room(
    room_id: str,
    service: RoomService = Depends(get_room_service),
    current_user: TokenPayload = Depends(get_current_participant),
):
    """
    방 종료 (방장만 가능)
    
    🔒 **인증 필요**: Authorization: Bearer <token>
    """
    # 방 일치 검증
    require_room_match(current_user, room_id)
    # 방장 검증
    require_host(current_user)
    
    try:
        results, winner = await service.close_room(room_id)
    except RoomNotFoundError:
        raise HTTPException(status_code=404, detail="Room not found")
    
    return CloseRoomResponse(
        success=True,
        final_results=[_to_vote_result_response(r) for r in results],
        winner=_to_candidate_response(winner) if winner else None,
    )
