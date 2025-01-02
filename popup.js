// Format selection handling
const formatOptions = document.querySelectorAll('.format-option');
let selectedFormat = 'mp3'; // Default format

// Helper function to format time (converts seconds to MM:SS)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Function to get video duration from YouTube
async function getVideoDuration(videoId) {
    try {
        // Get the current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Inject script to get video duration
        const [{result}] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const video = document.querySelector('video');
                return video ? video.duration : null;
            }
        });
        
        return result;
    } catch (error) {
        console.error('Error getting video duration:', error);
        return null;
    }
}

// Auto-fill times when popup opens
async function initializeTimes() {
    // Set default start time
    document.getElementById('startTime').value = '0:00';
    
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url.includes('youtube.com/watch')) {
        const videoId = new URLSearchParams(new URL(tab.url).search).get('v');
        const duration = await getVideoDuration(videoId);
        
        if (duration) {
            document.getElementById('endTime').value = formatTime(duration);
        }
    }
}

// Initialize times when popup opens
document.addEventListener('DOMContentLoaded', initializeTimes);

formatOptions.forEach(option => {
    option.addEventListener('click', () => {
        formatOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedFormat = option.dataset.format;
    });
});

// Add progress handling functions
function updateProgress(progress) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (progress === 'indeterminate') {
        progressBar.removeAttribute('value');
        progressText.textContent = 'Preparing download...';
    } else {
        progressBar.value = progress;
        progressText.textContent = `Downloading: ${Math.round(progress)}%`;
    }
}

function showProgress() {
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('clipButton').style.display = 'none';
    updateProgress('indeterminate');
}

function hideProgress() {
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('clipButton').style.display = 'block';
    document.getElementById('progressText').textContent = '';
}

// Modify the click event listener
document.getElementById('clipButton').addEventListener('click', async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('youtube.com/watch')) {
            alert('Please navigate to a YouTube video first!');
            return;
        }

        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        
        if (!startTime || !endTime) {
            alert('Please enter both start and end times');
            return;
        }

        const videoId = new URLSearchParams(new URL(tab.url).search).get('v');
        
        showProgress();

        // Set up EventSource for progress updates
        const eventSource = new EventSource(
            `http://localhost:3000/progress/${videoId}/${startTime}/${endTime}`
        );
        
        eventSource.onmessage = (event) => {
            const progress = JSON.parse(event.data);
            updateProgress(progress.percent);
        };

        eventSource.onerror = () => {
            eventSource.close();
        };

        const response = await fetch('http://localhost:3000/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                videoId,
                startTime,
                endTime,
                format: selectedFormat
            })
        });

        eventSource.close();

        const data = await response.json();
        if (response.ok) {
            alert('Download completed successfully!');
        } else {
            console.error('Download error:', data);
            alert(`Error starting download: ${data.error}\n\nCheck console for details.`);
        }
    } catch (error) {
        console.error('Extension error:', error);
        alert('Error: ' + error.message);
    } finally {
        hideProgress();
    }
}); 