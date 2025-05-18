#!/bin/bash

echo "===== CONSISTENCY CALENDAR APP RESTART SCRIPT ====="

# Kill any existing Node.js processes for this app
echo "Stopping existing Node.js processes..."
pkill -f "node.*consistency_cal" || true

# Wait a moment to ensure processes have stopped
sleep 2

# Check if .env.local exists
echo "Checking for .env.local file..."
if [ -f ".env.local" ]; then
  echo "✅ .env.local file found"
  
  # Count lines in .env.local without displaying sensitive content
  LINE_COUNT=$(wc -l < .env.local)
  echo "  - File contains $LINE_COUNT line(s)"
  
  # Check for expected environment variables without displaying values
  grep -q "NEXT_PUBLIC_GOOGLE_API_KEY" .env.local && echo "  - ✅ NEXT_PUBLIC_GOOGLE_API_KEY found" || echo "  - ❌ NEXT_PUBLIC_GOOGLE_API_KEY not found"
  grep -q "NEXT_PUBLIC_GOOGLE_CLIENT_ID" .env.local && echo "  - ✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID found" || echo "  - ❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID not found"
else
  echo "❌ .env.local file not found. Creating template..."
  
  # Create a template .env.local file
  cat > .env.local << EOL
# Google Calendar API credentials
# Get these from https://console.cloud.google.com/
NEXT_PUBLIC_GOOGLE_API_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
EOL
  
  echo "✅ Created .env.local template. Please edit it with your API credentials."
  echo "For detailed setup instructions, see GOOGLE_CALENDAR_SETUP.md"
  exit 1
fi

# Print environment variables for debugging (redacted for security)
echo "Checking environment variables:"
if [ -n "$NEXT_PUBLIC_GOOGLE_API_KEY" ]; then
  echo "✅ NEXT_PUBLIC_GOOGLE_API_KEY is set (${#NEXT_PUBLIC_GOOGLE_API_KEY} characters)"
  if [ ${#NEXT_PUBLIC_GOOGLE_API_KEY} -lt 10 ]; then
    echo "⚠️  Warning: API key seems too short. Please check if it's correct."
  fi
else
  echo "❌ NEXT_PUBLIC_GOOGLE_API_KEY is NOT set in current environment"
fi

if [ -n "$NEXT_PUBLIC_GOOGLE_CLIENT_ID" ]; then
  echo "✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID is set (${#NEXT_PUBLIC_GOOGLE_CLIENT_ID} characters)"
  if [[ "$NEXT_PUBLIC_GOOGLE_CLIENT_ID" != *".apps.googleusercontent.com" ]]; then
    echo "⚠️  Warning: Client ID doesn't end with .apps.googleusercontent.com. It may be incorrect."
  fi
else
  echo "❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is NOT set in current environment"
fi

# Check if port 3000 is already in use
echo "Checking if port 3000 is available..."
if lsof -i:3000 > /dev/null; then
  echo "⚠️  Port 3000 is already in use. Will try a different port."
  PORT=3001
else
  PORT=3000
fi

# Try to start the app
echo "Starting the app on port $PORT..."
echo "For detailed Google Calendar setup instructions, see GOOGLE_CALENDAR_SETUP.md"
echo "====================================================="
npm run dev -- -p $PORT 