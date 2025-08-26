@echo off
echo 🚀 AstraMind Phase-1 MVP - Quick Start
echo ========================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose found

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from template...
    copy env.example .env
    echo 📝 Please edit .env file with your API keys before continuing.
    echo    Required: OPENAI_API_KEY, YOUTUBE_API_KEY
    echo    Optional: GOOGLE_CALENDAR_CREDENTIALS
    echo.
    echo Press Enter when you've configured your API keys...
    pause
)

echo 🔧 Starting AstraMind services...
echo    Backend: http://localhost:8000
echo    Frontend: http://localhost:3000
echo.

REM Start services
docker-compose up --build

echo.
echo 🎉 AstraMind is now running!
echo    Open http://localhost:3000 in your browser
echo    API docs: http://localhost:8000/docs
echo.
pause
