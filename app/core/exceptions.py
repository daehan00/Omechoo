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
