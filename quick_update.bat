@echo off
echo Schnelles Server-Update...
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
echo Update abgeschlossen! Prüfe: https://35-195-246-45.nip.io/smartlaw-agent