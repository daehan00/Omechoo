"""방 관련 Pydantic 스키마 (Request DTOs)"""
from pydantic import BaseModel, Field, field_validator
from app.domain.entities.room import CandidateType


class CandidateInput(BaseModel):
    """후보 입력"""
    value: str = Field(..., min_length=1, description="메뉴명 또는 식당 URL")
    display_name: str | None = Field(None, description="표시용 이름 (선택)")


class CreateRoomRequest(BaseModel):
    """방 생성 요청"""
    name: str = Field(..., min_length=1, max_length=50, description="방 제목")
    host_nickname: str = Field(..., min_length=1, max_length=20, description="방장 닉네임")
    candidate_type: CandidateType = Field(..., description="후보 타입 (menu/restaurant)")
    candidates: list[CandidateInput] = Field(..., min_length=2, max_length=10, description="후보 목록 (2~10개)")
    max_participants: int = Field(default=10, ge=2, le=50, description="최대 참여자 수")
    expires_in_minutes: int | None = Field(default=30, ge=5, le=60, description="만료 시간 (분, 5~60)")

    @field_validator("candidates")
    @classmethod
    def validate_unique_candidates(cls, v: list[CandidateInput]) -> list[CandidateInput]:
        values = [c.value for c in v]
        if len(values) != len(set(values)):
            raise ValueError("후보는 중복될 수 없습니다")
        return v


class JoinRoomRequest(BaseModel):
    """방 참여 요청"""
    nickname: str = Field(..., min_length=1, max_length=20, description="닉네임")


class CastVoteRequest(BaseModel):
    """투표 요청"""
    candidate_id: str = Field(..., description="선택한 후보 ID")


class ChangeVoteRequest(BaseModel):
    """투표 변경 요청"""
    new_candidate_id: str = Field(..., description="새로 선택한 후보 ID")


# CloseRoomRequest 삭제됨 - 토큰에서 방장 여부 확인
