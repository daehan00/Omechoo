#!/bin/bash

# Omechoo 관리 스크립트
# 자주 사용하는 Docker Compose 명령어를 간편하게 실행

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 도움말 출력
show_help() {
    echo -e "${BLUE}=== Omechoo 관리 스크립트 ===${NC}"
    echo ""
    echo "사용법: ./scripts/manage.sh [명령어]"
    echo ""
    echo "명령어:"
    echo "  start              - 서비스 시작"
    echo "  stop               - 서비스 중지"
    echo "  restart            - 서비스 재시작"
    echo "  build              - 이미지 빌드"
    echo "  rebuild            - 이미지 재빌드 후 시작"
    echo "  status             - 서비스 상태 확인"
    echo "  logs [service]     - 로그 확인 (service 생략 시 전체)"
    echo "  shell <service>    - 컨테이너 쉘 접속 (backend, db, nginx)"
    echo "  reload-nginx       - nginx 설정 리로드"
    echo "  clean              - Docker 캐시 정리"
    echo "  deep-clean         - Docker 전체 정리 (이미지, 볼륨 포함)"
    echo "  health             - 헬스체크 실행"
    echo "  help               - 도움말 출력"
    echo ""
}

# 서비스 시작
start() {
    echo -e "${GREEN}서비스를 시작합니다...${NC}"
    docker compose up -d
    echo -e "${GREEN}✓ 서비스 시작 완료${NC}"
    docker compose ps
}

# 서비스 중지
stop() {
    echo -e "${YELLOW}서비스를 중지합니다...${NC}"
    docker compose down
    echo -e "${GREEN}✓ 서비스 중지 완료${NC}"
}

# 서비스 재시작
restart() {
    echo -e "${YELLOW}서비스를 재시작합니다...${NC}"
    docker compose restart
    echo -e "${GREEN}✓ 서비스 재시작 완료${NC}"
    docker compose ps
}

# 이미지 빌드
build() {
    echo -e "${BLUE}이미지를 빌드합니다...${NC}"
    docker compose build
    echo -e "${GREEN}✓ 빌드 완료${NC}"
}

# 재빌드 후 시작
rebuild() {
    echo -e "${BLUE}이미지를 재빌드하고 서비스를 시작합니다...${NC}"
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    echo -e "${GREEN}✓ 재빌드 및 시작 완료${NC}"
    docker compose ps
}

# 상태 확인
status() {
    echo -e "${BLUE}서비스 상태:${NC}"
    docker compose ps
    echo ""
    echo -e "${BLUE}Docker 리소스 사용량:${NC}"
    docker system df
}

# 로그 확인
logs() {
    local service=$1
    if [ -z "$service" ]; then
        echo -e "${BLUE}전체 로그를 확인합니다... (Ctrl+C로 종료)${NC}"
        docker compose logs -f
    else
        echo -e "${BLUE}${service} 로그를 확인합니다... (Ctrl+C로 종료)${NC}"
        docker compose logs -f "$service"
    fi
}

# 컨테이너 쉘 접속
shell() {
    local service=$1
    if [ -z "$service" ]; then
        echo -e "${RED}서비스 이름을 지정해주세요.${NC}"
        echo "예: ./scripts/manage.sh shell backend"
        exit 1
    fi
    
    case $service in
        backend)
            echo -e "${BLUE}backend 컨테이너에 접속합니다...${NC}"
            docker compose exec backend /bin/bash
            ;;
        db)
            echo -e "${BLUE}PostgreSQL 컨테이너에 접속합니다...${NC}"
            docker compose exec db psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-omechoo}
            ;;
        nginx)
            echo -e "${BLUE}nginx 컨테이너에 접속합니다...${NC}"
            docker compose exec nginx /bin/sh
            ;;
        *)
            echo -e "${RED}알 수 없는 서비스: $service${NC}"
            echo "사용 가능한 서비스: backend, db, nginx"
            exit 1
            ;;
    esac
}

# Nginx 리로드
reload_nginx() {
    echo -e "${YELLOW}nginx 설정을 리로드합니다...${NC}"
    docker compose exec nginx nginx -t
    docker compose exec nginx nginx -s reload
    echo -e "${GREEN}✓ nginx 리로드 완료${NC}"
}

# Docker 캐시 정리
clean() {
    echo -e "${YELLOW}Docker 캐시를 정리합니다...${NC}"
    docker system prune -f
    echo -e "${GREEN}✓ 정리 완료${NC}"
    docker system df
}

# Docker 전체 정리
deep_clean() {
    echo -e "${RED}⚠️  경고: 모든 Docker 이미지, 컨테이너, 볼륨이 삭제됩니다!${NC}"
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}서비스를 중지합니다...${NC}"
        docker compose down
        echo -e "${YELLOW}Docker 전체를 정리합니다...${NC}"
        docker system prune -a --volumes -f
        echo -e "${GREEN}✓ 전체 정리 완료${NC}"
        docker system df
    else
        echo "취소되었습니다."
    fi
}

# 헬스체크
health() {
    echo -e "${BLUE}헬스체크를 실행합니다...${NC}"
    
    # .env에서 도메인 가져오기
    if [ -f .env ]; then
        DOMAIN=$(grep DOMAIN_NAME .env | cut -d '=' -f2)
    fi
    
    if [ -z "$DOMAIN" ]; then
        DOMAIN="localhost"
    fi
    
    echo "도메인: $DOMAIN"
    echo ""
    
    # HTTP 체크
    echo -e "${BLUE}[HTTP Check]${NC}"
    curl -I http://$DOMAIN/health 2>&1 | head -n 5 || echo "HTTP 연결 실패"
    
    echo ""
    
    # HTTPS 체크
    echo -e "${BLUE}[HTTPS Check]${NC}"
    curl -I https://$DOMAIN/health 2>&1 | head -n 5 || echo "HTTPS 연결 실패"
}

# 메인 로직
case "${1:-help}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    build)
        build
        ;;
    rebuild)
        rebuild
        ;;
    status)
        status
        ;;
    logs)
        logs "${2}"
        ;;
    shell)
        shell "${2}"
        ;;
    reload-nginx)
        reload_nginx
        ;;
    clean)
        clean
        ;;
    deep-clean)
        deep_clean
        ;;
    health)
        health
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}알 수 없는 명령어: ${1}${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
