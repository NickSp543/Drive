@echo off
echo ========================================
echo   Drive App - Mobile Development Setup
echo ========================================
echo.

echo [1/3] Starting MongoDB and Backend with Docker...
docker-compose -f docker-compose.mobile.yml up -d

echo.
echo [2/3] Waiting for services to be ready...
timeout /t 5 /nobreak > nul

echo.
echo [3/3] Checking services...
docker-compose -f docker-compose.mobile.yml ps

echo.
echo ========================================
echo   Services are running!
echo ========================================
echo.
echo MongoDB:  localhost:27017
echo Backend:  localhost:3000
echo.
echo Now start Expo in a new terminal:
echo   cd MobileApp
echo   npx expo start --android
echo.
echo To stop services: docker-compose -f docker-compose.mobile.yml down
echo ========================================
pause
