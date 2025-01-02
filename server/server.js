const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Create downloads directory if it doesn't exist
if (!fs.existsSync('downloads')) {
    fs.mkdirSync('downloads');
}

app.post('/download', async (req, res) => {
    const { videoId, startTime, endTime, format } = req.body;
    
    // Input validation
    if (!videoId || !startTime || !endTime) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    try {
        const startSeconds = convertTimeToSeconds(startTime);
        const endSeconds = convertTimeToSeconds(endTime);
        
        // More specific format flags for each type
        const formatFlags = format === 'mp3' 
            ? [
                '--format "ba"',              // Best audio format
                '--extract-audio',            // Extract audio
                '--audio-format mp3',         // Convert to MP3
                '--audio-quality 0',          // Best quality
                '--postprocessor-args "-ar 44100"'  // Standard audio rate
              ].join(' ')
            : '--format "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]" --merge-output-format mp4';
            
        const timeRange = `*${startSeconds}-${endSeconds}`;
        
        const command = [
            `/Users/${process.env.USER}/.local/bin/yt-dlp`,
            formatFlags,
            `--download-sections "${timeRange}"`,
            '--force-keyframes-at-cuts',
            '--no-keep-video',
            '--no-part',
            '--progress',  // Show progress for debugging
            '-o "downloads/%(title)s.%(ext)s"',
            `"https://www.youtube.com/watch?v=${videoId}"`
        ].join(' ');
        
        console.log('Format selected:', format);
        console.log('Starting download with command:', command);
        
        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                console.error('Download error:', error);
                console.error('Command output:', stdout);
                console.error('Command errors:', stderr);
                return res.status(500).json({ 
                    error: 'Download failed',
                    details: {
                        message: error.message,
                        stdout: stdout,
                        stderr: stderr
                    }
                });
            }
            
            // Log success details
            console.log('Download completed successfully');
            console.log('Output:', stdout);
            
            res.json({ 
                message: 'Download completed',
                details: {
                    stdout: stdout,
                    stderr: stderr
                }
            });
        });
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
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