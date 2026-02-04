#!/bin/bash

# SSL 인증서 및 관련 데이터 완전 정리 스크립트
# 실패한 인증서 발급 기록을 깨끗하게 제거합니다

echo "=== SSL Certificate Cleanup ==="
echo ""
echo "⚠️  WARNING: This will remove all SSL certificates and related data!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# 1. Docker 컨테이너 중지 및 제거
echo "Step 1: Stopping all containers..."
docker compose down
echo "✓ Containers stopped"

# 2. Certbot 데이터 제거
echo "Step 2: Removing certbot data..."
rm -rf ./certbot/conf/*
rm -rf ./certbot/www/*
echo "✓ Certbot data removed"

# 3. 임시 nginx 설정 제거
echo "Step 3: Cleaning up temporary files..."
rm -f ./nginx/nginx.http-only.conf
echo "✓ Temporary files removed"

# 4. 고아 컨테이너 및 임시 컨테이너 제거
echo "Step 4: Removing orphaned containers..."
docker ps -a | grep omechoo-nginx-temp && docker rm -f omechoo-nginx-temp || echo "No temp nginx container found"
echo "✓ Cleanup complete"

echo ""
echo "✅ All SSL certificate data has been cleaned!"
echo "You can now run init-ssl.sh again to start fresh."
