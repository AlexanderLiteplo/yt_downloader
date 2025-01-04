#!/bin/bash

echo "🌸 Starting YouTube Clipper Setup 🌸"

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo "✅ Homebrew already installed"
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "🟢 Installing Node.js..."
    brew install node
else
    echo "✅ Node.js already installed"
fi

# Install FFmpeg if not present
if ! command -v ffmpeg &> /dev/null; then
    echo "🎬 Installing FFmpeg..."
    brew install ffmpeg
else
    echo "✅ FFmpeg already installed"
fi

# Install pipx if not present
if ! command -v pipx &> /dev/null; then
    echo "📦 Installing pipx..."
    brew install pipx
    pipx ensurepath
else
    echo "✅ pipx already installed"
fi

# Install/Update yt-dlp
echo "⬇️ Installing/Updating yt-dlp..."
pipx install yt-dlp || pipx upgrade yt-dlp

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install express cors

# Start the server
echo "🚀 Starting server..."
echo "💡 Press Ctrl+C to stop the server"
node server.js

# Note: The script will stay running with the server
