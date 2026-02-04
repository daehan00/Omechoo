#!/bin/bash

# SSL 인증서 정리 스크립트
# Let's Encrypt 인증서를 완전히 제거합니다

echo "=== SSL Certificate Cleanup ==="
echo ""
echo "⚠️  WARNING: This will remove all SSL certificates!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

DOMAIN=$1
if [ -z "$DOMAIN" ]; then
    read -p "Enter domain name to remove (or press Enter to remove all): " DOMAIN
fi

# 1. Docker 컨테이너 중지
echo "Step 1: Stopping containers..."
docker compose down
echo "✓ Containers stopped"

# 2. Let's Encrypt 인증서 제거
echo "Step 2: Removing certificates..."
if [ -z "$DOMAIN" ]; then
    sudo certbot delete --non-interactive || echo "No certificates found"
else
    sudo certbot delete --cert-name $DOMAIN --non-interactive || echo "Certificate not found"
fi
echo "✓ Certificates removed"

# 3. 임시 파일 정리
echo "Step 3: Cleaning up temporary files..."
rm -f ./nginx/nginx.http-only.conf
docker ps -a | grep nginx-temp && docker rm -f nginx-temp || true
echo "✓ Cleanup complete"

echo ""
echo "✅ SSL cleanup complete!"
echo "You can now run init-ssl.sh again to start fresh."
