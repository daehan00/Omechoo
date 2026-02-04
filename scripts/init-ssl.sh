#!/bin/bash

# SSL 인증서 발급 스크립트 (Standalone 방식)
# 사용법: ./init-ssl.sh your-domain.com your-email@example.com

set -e  # 에러 발생 시 즉시 중단

DOMAIN=$1
EMAIL=$2
STAGING=${3:-0}  # 1이면 staging 모드 (테스트용)

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: ./init-ssl.sh <domain> <email> [staging]"
    echo "Example: ./init-ssl.sh unknownlite.com admin@example.com"
    echo "         ./init-ssl.sh unknownlite.com admin@example.com 1  (staging mode)"
    exit 1
fi

echo "=== SSL Certificate Setup for $DOMAIN ==="
echo ""

# 1. Certbot 설치 확인
echo "Step 1: Checking certbot installation..."
if ! command -v certbot &> /dev/null; then
    echo "Certbot not found. Installing..."
    
    # OS 감지 및 설치
    if [ -f /etc/debian_version ]; then
        sudo apt update
        sudo apt install certbot -y
    elif [ -f /etc/redhat-release ]; then
        sudo yum install certbot -y
    else
        echo "❌ Unsupported OS. Please install certbot manually."
        exit 1
    fi
    
    echo "✓ Certbot installed"
else
    echo "✓ Certbot already installed ($(certbot --version))"
fi

# 2. 모든 Docker 컨테이너 중지 (포트 80 비우기)
echo "Step 2: Stopping all containers..."
docker compose down
echo "✓ Containers stopped"

# 3. Certbot standalone 모드로 인증서 발급
echo "Step 3: Requesting SSL certificate..."
if [ "$STAGING" = "1" ]; then
    echo "⚠️  Using STAGING mode (for testing)"
    STAGING_ARG="--staging"
else
    STAGING_ARG=""
fi

sudo certbot certonly --standalone \
    -d $DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING_ARG

# 4. 인증서 확인
echo "Step 4: Verifying certificate..."
if sudo test -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem"; then
    echo "✓ Certificate obtained successfully!"
    sudo ls -la /etc/letsencrypt/live/$DOMAIN/
else
    echo "❌ Certificate not found!"
    exit 1
fi

# 5. Docker Compose 서비스 시작
echo "Step 5: Starting services with SSL..."
docker compose up -d

echo "Waiting for services to start..."
sleep 10

# 6. 테스트
echo "Step 6: Testing HTTPS connection..."
if command -v curl &> /dev/null; then
    curl -I https://$DOMAIN/health 2>&1 | head -n 5
fi

echo ""
echo "✅ SSL certificate setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Set up auto-renewal:"
echo "     sudo crontab -e"
echo "     Add: 0 0 * * * certbot renew --post-hook \"cd $(pwd) && docker compose exec nginx nginx -s reload\""
echo ""
echo "  2. Test your site: https://$DOMAIN"
echo ""

