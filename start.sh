#!/bin/bash

echo "🚀 AstraMind Phase-1 MVP - Quick Start"
echo "========================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp env.example .env
    echo "📝 Please edit .env file with your API keys before continuing."
    echo "   Required: OPENAI_API_KEY, YOUTUBE_API_KEY"
    echo "   Optional: GOOGLE_CALENDAR_CREDENTIALS"
    echo ""
    echo "Press Enter when you've configured your API keys..."
    read
fi

echo "🔧 Starting AstraMind services..."
echo "   Backend: http://localhost:8000"
echo "   Frontend: http://localhost:3000"
echo ""

# Start services
docker-compose up --build

echo ""
echo "🎉 AstraMind is now running!"
echo "   Open http://localhost:3000 in your browser"
echo "   API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop services"
