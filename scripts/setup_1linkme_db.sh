#!/bin/bash

# Omechoo DB 컨테이너 이름 확인 (docker-compose.yml의 container_name)
DB_CONTAINER="omechoo-postgres"

echo "Creating 1LinkMe database and user in $DB_CONTAINER..."

# 1. 유저 생성 (존재하면 에러 무시)
docker exec -it $DB_CONTAINER psql -U omechoo -d postgres -c "CREATE USER rootuser WITH PASSWORD '1fcab4Asdf9FF0n';" || echo "User might already exist."

# 2. DB 생성
docker exec -it $DB_CONTAINER psql -U omechoo -d postgres -c "CREATE DATABASE \"1linkme\";" || echo "Database might already exist."

# 3. 권한 부여
docker exec -it $DB_CONTAINER psql -U omechoo -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"1linkme\" TO rootuser;"

echo "Done! You can now start the 1LinkMe service."
