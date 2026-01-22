app/
├── core/           # 설정, 로깅, 예외 처리 등 공통 모듈
├── models/         # 데이터베이스 ORM 모델 (DB 스키마)
├── schemas/        # Pydantic DTO (API 입출력 데이터 정의)
├── services/       # 핵심 비즈니스 로직 (여기가 가장 중요합니다)
│   ├── base.py     # ★ 추상 클래스 (Interface) 정의
│   ├── recommender.py # 메뉴 추천 구현체
│   └── locator.py     # 식당 검색 구현체
├── api/
│   └── routes/
│       └── api.py  # 엔드포인트
└── main.py