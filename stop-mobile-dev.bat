@echo off
echo Stopping Mobile Development Services...
docker-compose -f docker-compose.mobile.yml down
echo Services stopped.
pause
