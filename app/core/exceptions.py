class OmechooError(Exception):
    """Base exception"""
    pass


class RecommendationError(OmechooError):
    """추천 실패"""
    pass


class RestaurantNotFoundError(OmechooError):
    """식당을 찾을 수 없음"""
    pass


class InvalidUrlError(OmechooError):
    """유효하지 않은 URL"""
    pass


class ExternalAPIError(OmechooError):
    """외부 API 오류"""
    
    def __init__(self, provider: str, message: str):
        self.provider = provider
        super().__init__(f"[{provider}] {message}")


# ============ Room 관련 예외 ============

class RoomError(OmechooError):
    """방 관련 기본 예외"""
    pass


class RoomNotFoundError(RoomError):
    """방을 찾을 수 없음"""
    def __init__(self, room_id: str):
        self.room_id = room_id
        super().__init__(f"Room not found: {room_id}")


class RoomExpiredError(RoomError):
    """방이 만료됨"""
    def __init__(self, room_id: str):
        self.room_id = room_id
        super().__init__(f"Room expired: {room_id}")


class RoomFullError(RoomError):
    """방 정원 초과"""
    def __init__(self, room_id: str, max_participants: int):
        self.room_id = room_id
        self.max_participants = max_participants
        super().__init__(f"Room is full (max: {max_participants})")


class RoomNotVotingError(RoomError):
    """투표 불가 상태"""
    def __init__(self, room_id: str, current_status: str):
        self.room_id = room_id
        self.current_status = current_status
        super().__init__(f"Room is not in voting status: {current_status}")


class NicknameTakenError(RoomError):
    """닉네임 중복"""
    def __init__(self, nickname: str):
        self.nickname = nickname
        super().__init__(f"Nickname already taken: {nickname}")


class AlreadyVotedError(RoomError):
    """이미 투표함"""
    def __init__(self, participant_id: str):
        self.participant_id = participant_id
        super().__init__(f"Already voted: {participant_id}")


class InvalidCandidateError(RoomError):
    """유효하지 않은 후보"""
    def __init__(self, candidate_id: str):
        self.candidate_id = candidate_id
        super().__init__(f"Invalid candidate: {candidate_id}")


class NotHostError(RoomError):
    """방장 권한 없음"""
    def __init__(self, participant_id: str):
        self.participant_id = participant_id
        super().__init__(f"Not a host: {participant_id}")


class ParticipantNotFoundError(RoomError):
    """참여자를 찾을 수 없음"""
    def __init__(self, participant_id: str):
        self.participant_id = participant_id
        super().__init__(f"Participant not found: {participant_id}")
