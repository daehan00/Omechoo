"""방 관련 Pydantic 스키마 (Response DTOs)"""
from datetime import datetime
from pydantic import BaseModel, Field
from app.domain.entities.room import CandidateType, RoomStatus


class CandidateResponse(BaseModel):
    """후보 응답"""
    id: str
    value: str
    display_name: str | None


class ParticipantResponse(BaseModel):
    """참여자 응답 (id는 보안상 노출하지 않음)"""
    nickname: str
    is_host: bool
    joined_at: datetime


class VoteResultResponse(BaseModel):
    """투표 결과 응답"""
    candidate: CandidateResponse
    vote_count: int
    voters: list[str]  # 닉네임 목록


class RoomResponse(BaseModel):
    """방 기본 정보 응답"""
    id: str
    name: str
    candidate_type: CandidateType
    candidates: list[CandidateResponse]
    status: RoomStatus
    max_participants: int
    participant_count: int
    expires_at: datetime | None
    created_at: datetime


class RoomDetailResponse(BaseModel):
    """방 상세 정보 응답 (참여자, 투표 현황 포함)"""
    room: RoomResponse
    participants: list[ParticipantResponse]
    results: list[VoteResultResponse]
    my_vote: str | None = Field(None, description="내가 투표한 후보 ID")


class JoinRoomResponse(BaseModel):
    """방 참여 응답"""
    token: str = Field(..., description="JWT 인증 토큰")
    nickname: str
    is_host: bool
    room: RoomResponse


class CreateRoomResponse(BaseModel):
    """방 생성 응답"""
    room_id: str
    share_url: str  # 공유용 URL
    token: str = Field(..., description="JWT 인증 토큰 (Authorization: Bearer 헤더에 사용)")


class VoteResponse(BaseModel):
    """투표 응답"""
    success: bool
    message: str
    results: list[VoteResultResponse]


class CloseRoomResponse(BaseModel):
    """방 종료 응답"""
    success: bool
    final_results: list[VoteResultResponse]
    winner: CandidateResponse | None  # 1등 후보 (동점이면 None)
