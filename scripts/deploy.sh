#!/bin/bash

# 간편 배포 스크립트
# 이미 SSL 인증서가 있는 경우 사용

echo "=== Deploying Omechoo Backend ==="

# 환경 변수 확인
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# 도메인 이름 가져오기
DOMAIN=$(grep DOMAIN_NAME .env | cut -d '=' -f2)

if [ -z "$DOMAIN" ]; then
    echo "❌ DOMAIN_NAME not set in .env"
    exit 1
fi

echo "Domain: $DOMAIN"

# SSL 인증서 확인
if [ ! -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo ""
    echo "⚠️  No SSL certificate found!"
    echo "Please run: ./scripts/init-ssl.sh $DOMAIN your-email@example.com"
    echo ""
    read -p "Continue without SSL? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 서비스 시작
echo "Starting services..."
docker-compose down
docker-compose up -d --build

# 상태 확인
echo ""
echo "Waiting for services to start..."
sleep 10

# 컨테이너 상태 확인
echo ""
echo "=== Container Status ==="
docker-compose ps

# 헬스 체크
echo ""
echo "=== Health Check ==="
if curl -f -s http://localhost/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend health check failed!"
    echo "Checking logs..."
    docker-compose logs --tail=20 backend
fi

echo ""
echo "=== Deployment Complete ==="
echo "HTTP:  http://$DOMAIN"
echo "HTTPS: https://$DOMAIN"
echo ""
echo "Check logs: docker-compose logs -f"
