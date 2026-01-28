from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정"""
    
    # 앱 기본 설정
    APP_NAME: str = "Omechoo"
    VERSION: str = "0.1.0"
    DEBUG: bool = True
    
    # 데이터베이스
    DATABASE_URL: str = "sqlite:///./omechoo.db"
    
    # JWT 인증
    JWT_SECRET_KEY: str = "omechoo-room-secret-key-change-in-production"
    
    # API Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 10
    
    # Phase 2+ (미래 확장)
    WEATHER_API_ENABLED: bool = False
    WEATHER_API_KEY: str = ""

    KAKAO_REST_API_KEY: str = ""
    KAKAO_BASE_URL: str = "https://dapi.kakao.com/v2/local"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# 설정 인스턴스 (싱글톤)
settings = Settings()