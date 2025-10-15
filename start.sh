#!/bin/bash

# Telegram Job Platform Startup Script

echo "🚀 Starting Telegram Job Platform..."

# Check if we're in the right directory
if [ ! -f "backend/requirements.txt" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command_exists psql; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 12+"
    exit 1
fi

if ! command_exists redis-server; then
    echo "❌ Redis is not installed. Please install Redis 6+"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup backend
echo "🔧 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create uploads directory
mkdir -p uploads

# Check if .env exists, if not copy from example
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp env.example .env
    echo "⚠️  Please edit backend/.env with your configuration before continuing"
    echo "   - Set your DATABASE_URL"
    echo "   - Set your TELEGRAM_BOT_TOKEN"
    echo "   - Set your SECRET_KEY"
    exit 1
fi

cd ..

# Setup frontend
echo "🔧 Setting up frontend..."
cd frontend

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
fi

cd ..

echo "✅ Setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Edit backend/.env with your configuration"
echo "2. Create a PostgreSQL database named 'telegram_jobs'"
echo "3. Start Redis server: redis-server"
echo "4. Start the backend: cd backend && python run.py"
echo "5. Start the frontend: cd frontend && npm run dev"
echo "6. Create a Telegram bot and set up the Web App"
echo ""
echo "🌐 The application will be available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000"
echo "   - API Docs: http://localhost:8000/docs"
