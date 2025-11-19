#!/bin/bash


echo "Arrêt du POC AREA..."

docker stop area-poc-frontend area-poc-backend area-poc-postgres 2>/dev/null
docker rm area-poc-frontend area-poc-backend area-poc-postgres 2>/dev/null
docker network rm poc-network 2>/dev/null

echo "POC arrêté et nettoyé !"
