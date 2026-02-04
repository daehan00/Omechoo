#!/bin/bash

# SSL 인증서 초기 발급 스크립트 (개선 버전)
# 사용법: ./init-ssl.sh your-domain.com your-email@example.com

set -e  # 에러 발생 시 즉시 중단

DOMAIN=$1
EMAIL=$2
STAGING=${3:-0}  # 1이면 staging 모드 (테스트용)

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: ./init-ssl.sh <domain> <email> [staging]"
    echo "Example: ./init-ssl.sh omechoo.example.com admin@example.com"
    echo "         ./init-ssl.sh omechoo.example.com admin@example.com 1  (staging mode)"
    exit 1
fi

echo "=== SSL Certificate Setup for $DOMAIN ==="
echo ""

# 0. 이전 실패 기록 정리 (선택사항)
read -p "이전 certbot 데이터를 정리하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Step 0: Cleaning up old certbot data..."
    docker compose down
    rm -rf ./certbot/conf/*
    rm -rf ./certbot/www/*
    echo "✓ Cleanup complete"
fi

# 1. 필수 디렉토리 생성
echo "Step 1: Creating directories..."
mkdir -p ./certbot/conf
mkdir -p ./certbot/www
echo "✓ Directories created"

# 2. 데이터베이스와 백엔드만 먼저 시작
echo "Step 2: Starting database and backend..."
docker compose up -d db backend
echo "Waiting for services to be ready..."
sleep 10

# 3. HTTP only로 Nginx 임시 시작 (HTTPS 설정 없이)
echo "Step 3: Creating temporary HTTP-only nginx config..."
cat > ./nginx/nginx.http-only.conf << 'EOF'
upstream backend {
    server backend:8000;
    keepalive 32;
}

server {
    listen 80;
    server_name _;

    # Let's Encrypt 인증서 발급용
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # 임시로 모든 요청 허용
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "Starting nginx with HTTP-only config..."
docker run -d --name omechoo-nginx-temp \
    --network omechoo_default \
    -p 80:80 \
    -v "$(pwd)/nginx/nginx.http-only.conf:/etc/nginx/conf.d/default.conf:ro" \
    -v "$(pwd)/certbot/www:/var/www/certbot:ro" \
    nginx:alpine

echo "Waiting for nginx to start..."
sleep 5

# 4. Nginx 상태 확인
if ! docker ps | grep -q omechoo-nginx-temp; then
    echo "❌ Nginx failed to start!"
    docker logs omechoo-nginx-temp
    exit 1
fi
echo "✓ Nginx started successfully"

# 5. Let's Encrypt 인증서 발급
echo "Step 4: Requesting Let's Encrypt certificate..."
if [ "$STAGING" = "1" ]; then
    echo "⚠️  Using STAGING mode (for testing)"
    STAGING_ARG="--staging"
else
    STAGING_ARG=""
fi

docker compose run --rm certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING_ARG \
    -d $DOMAIN

# 6. 인증서 발급 결과 확인
echo "Step 5: Verifying certificate..."
if [ -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    echo "✓ Certificate obtained successfully!"
    docker compose run --rm certbot certificates
else
    echo "❌ Certificate file not found!"
    echo "Checking certbot logs..."
    docker compose logs certbot
    docker stop omechoo-nginx-temp
    docker rm omechoo-nginx-temp
    exit 1
fi

# 7. 임시 nginx 중지 및 정식 nginx 시작
echo "Step 6: Switching to production nginx configuration..."
docker stop omechoo-nginx-temp
docker rm omechoo-nginx-temp

# 정식 nginx 시작 (HTTPS 포함)
docker compose up -d nginx

echo "Waiting for nginx to reload..."
sleep 5

# 8. Certbot 자동 갱신 컨테이너 시작
echo "Step 7: Starting certbot auto-renewal..."
docker compose up -d certbot

echo ""
echo "✅ SSL certificate setup complete!"
echo "Your site should now be accessible via:"
echo "  - http://$DOMAIN (redirects to HTTPS)"
echo "  - https://$DOMAIN"
echo ""
echo "Testing HTTPS connection..."
if command -v curl &> /dev/null; then
    curl -I https://$DOMAIN 2>&1 | head -n 1
fi

