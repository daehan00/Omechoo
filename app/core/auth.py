"""JWT 기반 인증 모듈"""
from datetime import datetime, timedelta
from dataclasses import dataclass
from typing import Annotated
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings


# JWT 설정
SECRET_KEY = getattr(settings, 'JWT_SECRET_KEY', 'omechoo-room-secret-key-change-in-production')
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24  # 토큰 만료 시간


@dataclass
class TokenPayload:
    """토큰 페이로드 (인증된 참여자 정보)"""
    room_id: str
    participant_id: str
    nickname: str
    is_host: bool
    exp: datetime | None = None


# Bearer 토큰 스키마
bearer_scheme = HTTPBearer(auto_error=False)


def create_participant_token(
    room_id: str,
    participant_id: str,
    nickname: str,
    is_host: bool,
    expires_delta: timedelta | None = None,
) -> str:
    """참여자용 JWT 토큰 생성
    
    Args:
        room_id: 방 ID
        participant_id: 참여자 ID
        nickname: 닉네임
        is_host: 방장 여부
        expires_delta: 만료 시간 (기본 24시간)
    
    Returns:
        JWT 토큰 문자열
    """
    if expires_delta is None:
        expires_delta = timedelta(hours=TOKEN_EXPIRE_HOURS)
    
    expire = datetime.utcnow() + expires_delta
    
    payload = {
        "room_id": room_id,
        "participant_id": participant_id,
        "nickname": nickname,
        "is_host": is_host,
        "exp": expire,
    }
    
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> TokenPayload:
    """JWT 토큰 디코딩 및 검증
    
    Args:
        token: JWT 토큰 문자열
    
    Returns:
        TokenPayload 객체
    
    Raises:
        HTTPException: 토큰이 유효하지 않거나 만료된 경우
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return TokenPayload(
            room_id=payload["room_id"],
            participant_id=payload["participant_id"],
            nickname=payload["nickname"],
            is_host=payload["is_host"],
            exp=datetime.fromtimestamp(payload["exp"]) if "exp" in payload else None,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_participant(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> TokenPayload:
    """현재 인증된 참여자 정보 추출 (필수)
    
    모든 인증이 필요한 엔드포인트에서 사용
    
    Usage:
        @router.post("/vote")
        async def cast_vote(
            current_user: TokenPayload = Depends(get_current_participant)
        ):
            print(current_user.room_id, current_user.is_host)
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return decode_token(credentials.credentials)


async def get_current_participant_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> TokenPayload | None:
    """현재 인증된 참여자 정보 추출 (선택)
    
    인증이 선택적인 엔드포인트에서 사용 (예: 방 조회)
    """
    if credentials is None:
        return None
    
    try:
        return decode_token(credentials.credentials)
    except HTTPException:
        return None


def require_host(current_user: TokenPayload) -> TokenPayload:
    """방장 권한 검증
    
    Usage:
        @router.post("/start")
        async def start_voting(
            current_user: TokenPayload = Depends(get_current_participant)
        ):
            require_host(current_user)  # 방장 아니면 403
    """
    if not current_user.is_host:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only host can perform this action",
        )
    return current_user


def require_room_match(current_user: TokenPayload, room_id: str) -> None:
    """방 ID 일치 검증
    
    토큰의 room_id와 요청 경로의 room_id가 일치하는지 확인
    """
    if current_user.room_id != room_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token does not match this room",
        )
