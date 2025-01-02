const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Store active downloads with timestamps
const activeDownloads = new Map();

if (!fs.existsSync('downloads')) {
    fs.mkdirSync('downloads');
}

// SSE endpoint for progress updates
app.get('/progress/:videoId/:startTime/:endTime', (req, res) => {
    const { videoId, startTime, endTime } = req.params;
    const downloadId = getDownloadId(videoId, startTime, endTime);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Store the response object to send progress updates
    activeDownloads.set(downloadId, res);
    
    req.on('close', () => {
        activeDownloads.delete(downloadId);
    });
});

// Helper function to generate unique download ID
function getDownloadId(videoId, startTime, endTime) {
    return `${videoId}_${startTime}_${endTime}`;
}

app.post('/download', async (req, res) => {
    const { videoId, startTime, endTime, format } = req.body;
    
    if (!videoId || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const downloadId = getDownloadId(videoId, startTime, endTime);
    
    // Check if download is already in progress
    if (activeDownloads.has(downloadId)) {
        return res.status(409).json({ error: 'Download already in progress' });
    }
    
    try {
        const startSeconds = convertTimeToSeconds(startTime);
        const endSeconds = convertTimeToSeconds(endTime);
        
        const formatFlags = format === 'mp3' 
            ? [
                '--format "ba"',
                '--extract-audio',
                '--audio-format mp3',
                '--audio-quality 0',
                '--postprocessor-args "-ar 44100"'
              ].join(' ')
            : '--format "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" --merge-output-format mp4';
            
        const timeRange = `*${startSeconds}-${endSeconds}`;
        
        // Include timestamps in filename
        const outputTemplate = `downloads/%(title)s_${startTime}-${endTime}.%(ext)s`;
        
        const command = [
            `/Users/${process.env.USER}/.local/bin/yt-dlp`,
            formatFlags,
            `--download-sections "${timeRange}"`,
            '--force-keyframes-at-cuts',
            '--no-keep-video',
            '--no-part',
            '--progress',
            `-o "${outputTemplate}"`,
            `"https://www.youtube.com/watch?v=${videoId}"`
        ].join(' ');
        
        console.log('Format selected:', format);
        console.log('Starting download with command:', command);
        
        const downloadProcess = exec(command, { maxBuffer: 1024 * 1024 * 10 });
        
        // Parse progress from stderr
        downloadProcess.stderr.on('data', (data) => {
            const progressMatch = data.toString().match(/(\d+\.?\d*)%/);
            if (progressMatch && activeDownloads.has(downloadId)) {
                const progress = parseFloat(progressMatch[1]);
                activeDownloads.get(downloadId).write(`data: ${JSON.stringify({ percent: progress })}\n\n`);
            }
        });
        
        downloadProcess.on('exit', (code) => {
            if (activeDownloads.has(downloadId)) {
                const res = activeDownloads.get(downloadId);
                res.write(`data: ${JSON.stringify({ percent: 100 })}\n\n`);
                res.end();
                activeDownloads.delete(downloadId);
            }
        });
        
        res.json({ message: 'Download started' });
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
        // Clean up on error
        activeDownloads.delete(downloadId);
    }
});

function convertTimeToSeconds(timeStr) {
    try {
        const [minutes, seconds] = timeStr.split(':').map(Number);
        if (isNaN(minutes) || isNaN(seconds)) {
            throw new Error('Invalid time format');
        }
        return minutes * 60 + seconds;
    } catch (error) {
        throw new Error('Invalid time format. Please use MM:SS format');
    }
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 