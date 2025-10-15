#!/bin/bash

echo "🚀 Starting all services..."

# Kill any existing processes first
echo "🧹 Cleaning up existing processes..."
pkill -f "python.*run.py" 2>/dev/null || true
pkill -f "python.*app.bot" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "ngrok" 2>/dev/null || true

sleep 2

# Start Frontend
echo "📱 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 5

# Start Ngrok
echo "🌐 Starting Ngrok tunnel..."
ngrok http 3000 &
NGROK_PID=$!
echo "Ngrok PID: $NGROK_PID"

# Wait for ngrok to start
sleep 5

# Get ngrok URL
echo "🔗 Getting Ngrok URL..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | sed 's/"public_url":"//;s/"//')
echo "Ngrok URL: $NGROK_URL"

# Update backend config
echo "⚙️  Updating backend configuration..."
cd ../backend
sed -i '' "s|TELEGRAM_WEBAPP_URL=.*|TELEGRAM_WEBAPP_URL=$NGROK_URL|" .env
echo "Updated TELEGRAM_WEBAPP_URL to: $NGROK_URL"

# Start Backend
echo "🔧 Starting Backend..."
source venv/bin/activate
python run.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start Bot
echo "🤖 Starting Telegram Bot..."
source venv/bin/activate
python -m app.bot &
BOT_PID=$!
echo "Bot PID: $BOT_PID"

# Wait for bot to start
sleep 3

# Save PIDs to file for cleanup
echo "$FRONTEND_PID" > .pids
echo "$NGROK_PID" >> .pids
echo "$BACKEND_PID" >> .pids
echo "$BOT_PID" >> .pids

echo ""
echo "✅ All services started!"
echo "📱 Frontend: http://localhost:3000"
echo "🌐 Ngrok: $NGROK_URL"
echo "🔧 Backend: http://localhost:8000"
echo "🤖 Bot: @cleanfit_bot"
echo ""
echo "🎯 Test the bot by sending /start to @cleanfit_bot"
echo ""
echo "To stop all services, run: ./kill_all.sh"