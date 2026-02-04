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

# certbot 디렉토리 생성
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# 임시 자체 서명 인증서 생성 (nginx 시작용)
echo "Creating temporary self-signed certificate..."
openssl req -x509 -nodes -newkey rsa:4096 -days 1 \
    -keyout ./certbot/conf/privkey.pem \
    -out ./certbot/conf/fullchain.pem \
    -subj "/CN=$DOMAIN"

mkdir -p ./certbot/conf/live/$DOMAIN
mv ./certbot/conf/privkey.pem ./certbot/conf/live/$DOMAIN/
mv ./certbot/conf/fullchain.pem ./certbot/conf/live/$DOMAIN/

echo "Starting nginx..."
docker-compose up -d nginx

echo "Requesting Let's Encrypt certificate..."
docker-compose run --rm certbot certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

echo "Reloading nginx..."
docker-compose exec nginx nginx -s reload

echo "SSL certificate setup complete!"
