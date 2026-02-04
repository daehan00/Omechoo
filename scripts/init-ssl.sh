#!/bin/bash

# SSL 인증서 초기 발급 스크립트
# 사용법: ./init-ssl.sh your-domain.com your-email@example.com

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: ./init-ssl.sh <domain> <email>"
    echo "Example: ./init-ssl.sh omechoo.example.com admin@example.com"
    exit 1
fi

echo "=== SSL Certificate Setup for $DOMAIN ==="

# 1. certbot 디렉토리 생성
echo "Step 1: Creating directories..."
mkdir -p ./certbot/conf/live/$DOMAIN
mkdir -p ./certbot/www

# 2. 임시 자체 서명 인증서 생성
echo "Step 2: Creating temporary self-signed certificate..."
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout ./certbot/conf/live/$DOMAIN/privkey.pem \
    -out ./certbot/conf/live/$DOMAIN/fullchain.pem \
    -subj "/CN=$DOMAIN" 2>/dev/null

# 3. Nginx 시작 (임시 인증서로)
echo "Step 3: Starting nginx with temporary certificate..."
docker compose up -d db backend nginx

# 잠시 대기 (nginx가 완전히 시작될 때까지)
echo "Waiting for nginx to start..."
sleep 5

# 4. Let's Encrypt 인증서 발급
echo "Step 4: Requesting Let's Encrypt certificate..."
docker compose run --rm certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN

# 5. 결과 확인
if [ -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
    # 인증서 정보 확인
    echo "Step 5: Verifying certificate..."
    docker compose run --rm certbot certificates
    
    # Nginx 리로드
    echo "Step 6: Reloading nginx..."
    docker compose exec nginx nginx -s reload
    
    echo ""
    echo "✅ SSL certificate setup complete!"
    echo "Your site should now be accessible via https://$DOMAIN"
else
    echo ""
    echo "❌ SSL certificate generation failed!"
    echo "Please check:"
    echo "  1. DNS is properly configured ($DOMAIN -> your server IP)"
    echo "  2. Port 80 is accessible from the internet"
    echo "  3. Domain is spelled correctly"
    exit 1
fi

