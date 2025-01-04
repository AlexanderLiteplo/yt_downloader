# 🌸 YouTube Clipper Setup Guide 🌸

## 📦 Quick Setup
Run this command to automatically install everything and start the server:
bash
```./setup.sh```

Or if you prefer to set things up manually, follow these steps:
## 📦 Requirements to Install
1. 🟢 Node.js - download from https://nodejs.org/
2. 🎬 FFmpeg - run: `brew install ffmpeg`
3. ⬇️ yt-dlp - run: `brew install yt-dlp`
4. 📦 pipx - run: `brew install pipx`
5. 🔧 Install yt-dlp using pipx: `pipx install yt-dlp`

## 🔮 Chrome Extension Setup
1. 🌐 Open Chrome
2. 🎯 Go to `chrome://extensions/`
3. ⚙️ Turn on "Developer mode" (top right corner)
4. 📂 Click "Load unpacked"
5. ✨ Select the "extension" folder from this project

## 🚀 Server Setup
1. 💻 Open terminal
2. 📁 Navigate to project folder
3. 🗂️ `cd server`
4. 📥 `npm install express cors`
5. ▶️ `node server.js`
6. ✅ Server should say "Server running at http://localhost:3000"

## 🎀 How to Use
1. 🎥 Go to any YouTube video
2. 🖱️ Click extension icon
3. ⏰ Start time will be 0:00 by default
4. ⌛ End time will be video length by default
5. 💿 Select MP3 or MP4 format (MP3 is default)
6. 💫 Click "Download Clip"
7. 📥 Downloaded files will be in server/downloads folder

## 🔧 Troubleshooting
- ❌ If download fails, check server console for errors
- 🌐 Make sure server is running at http://localhost:3000
- ✔️ Make sure all requirements are installed
- 🛠️ Check if FFmpeg and yt-dlp are working: run `yt-dlp --version` and `ffmpeg -version`

## 📝 Note
- 🔄 Server must be running for extension to work
- ⏳ Downloads might take a few minutes depending on video length
- 🎵 MP3 downloads will be audio only
- 🎥 MP4 downloads will include video and audio