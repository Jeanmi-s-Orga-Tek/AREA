cd Backend && ./build_fastapi_docker_image.sh
docker compose build client_web
sudo docker compose up
