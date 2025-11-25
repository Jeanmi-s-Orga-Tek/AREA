#!/bin/bash

set -e 

echo "Démarrage du POC AREA..."
echo ""

if ! command -v docker &> /dev/null; then
    echo "Docker n'est pas installé. Installez-le d'abord :"
    echo "   sudo dnf install docker"
    echo "   sudo systemctl start docker"
    exit 1
fi

cd "$(dirname "$0")"

echo "Nettoyage des anciens conteneurs..."
docker stop area-poc-postgres 2>/dev/null || true
docker rm area-poc-postgres 2>/dev/null || true
docker stop area-poc-backend 2>/dev/null || true
docker rm area-poc-backend 2>/dev/null || true
docker stop area-poc-frontend 2>/dev/null || true
docker rm area-poc-frontend 2>/dev/null || true

echo "Création du réseau Docker..."
docker network create poc-network 2>/dev/null || true

echo ""
echo "Démarrage de PostgreSQL..."
docker run -d \
  --name area-poc-postgres \
  --network poc-network \
  -e POSTGRES_USER=area_user \
  -e POSTGRES_PASSWORD=area_password \
  -e POSTGRES_DB=area_poc \
  -p 5432:5432 \
  postgres:15-alpine

echo "  Attente de PostgreSQL..."
sleep 5

echo ""
echo "🔧 Construction du backend..."
docker build -t area-poc-backend ./backend

echo "Démarrage du backend..."
docker run -d \
  --name area-poc-backend \
  --network poc-network \
  -e DATABASE_URL="postgresql://area_user:area_password@area-poc-postgres:5432/area_poc" \
  -p 8080:8080 \
  -v "$(pwd)/backend/app:/code/app" \
  -v "$(pwd)/backend/discord:/code/discord" \
  area-poc-backend

echo " Attente du backend..."
sleep 3

echo ""
echo "Construction du frontend..."
docker build -t area-poc-frontend ./web

echo "Démarrage du frontend..."
docker run -d \
  --name area-poc-frontend \
  --network poc-network \
  -p 8081:80 \
  area-poc-frontend

echo ""
echo "======================================"
echo " POC AREA démarré avec succès !"
echo "======================================"
echo ""
echo " Accès aux services :"
echo "   Frontend :     http://localhost:8081"
echo "   Backend API :  http://localhost:8080"
echo "   API Docs :     http://localhost:8080/docs"
echo "   PostgreSQL :   localhost:5432"
echo ""
echo " Voir les logs :"
echo "   Backend :   docker logs -f area-poc-backend"
echo "   Frontend :  docker logs -f area-poc-frontend"
echo "   Postgres :  docker logs -f area-poc-postgres"
echo ""
echo "Pour TOUT arrêter :"
echo "   ./stop_poc.sh"
echo ""
