// API URL - automatically detects production or development
let API_URL;
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_URL = 'http://localhost:5000';
} else {
    // Production: use backend URL
    // Update this with your production backend URL
    API_URL = window.location.origin;
}

console.log('API URL:', API_URL);

const form = document.getElementById('converterForm');
const convertBtn = document.getElementById('convertBtn');
const btnText = convertBtn.querySelector('.btn-text');
const btnLoader = convertBtn.querySelector('.btn-loader');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressMessage = document.getElementById('progressMessage');
const progressPercent = document.getElementById('progressPercent');

// Hide messages
function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Show/hide progress bar
function showProgress(percent, message) {
    progressContainer.style.display = 'block';
    updateProgress(percent, message);
}

function hideProgress() {
    progressContainer.style.display = 'none';
    progressBar.style.width = '0%';
}

function updateProgress(percent, message) {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    progressBar.style.width = `${clampedPercent}%`;
    progressPercent.textContent = `${Math.round(clampedPercent)}%`;
    progressMessage.textContent = message;
}

// Show error message (informal)
function showError(message) {
    // Add informal prefix if there's no emoji already
    if (!message.match(/^[😬😅🤦🙄❌⚠️]/)) {
        errorMessage.textContent = `😬 Oops! ${message}`;
    } else {
        errorMessage.textContent = message;
    }
    errorMessage.style.display = 'flex';
    successMessage.style.display = 'none';
}

// Show success message (informal)
function showSuccess(message) {
    // Add informal prefix if there's no emoji already
    if (!message.match(/^[🎉✅👍✨]/)) {
        successMessage.textContent = `🎉 ${message}`;
    } else {
        successMessage.textContent = message;
    }
    successMessage.style.display = 'flex';
    errorMessage.style.display = 'none';
}

// Validate YouTube URL
function isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/.+/;
    return youtubeRegex.test(url);
}

// Handle button loading state
function setLoading(loading) {
    if (loading) {
        convertBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
    } else {
        convertBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// Handle file download
function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    hideMessages();
    
    const youtubeUrl = document.getElementById('youtubeUrl').value.trim();
    const audioFormat = document.getElementById('audioFormat').value;
    
    // URL validation
    if (!youtubeUrl) {
        showError('Come on, paste a YouTube URL! 😅');
        return;
    }
    
    if (!isValidYouTubeUrl(youtubeUrl)) {
        showError('This doesn\'t look like a valid YouTube URL... 🤔');
        return;
    }
    
    // Check if it's a playlist (not supported)
    if (youtubeUrl.includes('/playlist')) {
        showError('Playlists? Not yet, sorry! Use a single video 🙄');
        return;
    }
    
    setLoading(true);
    hideMessages();
    showProgress(0, 'Let\'s go! 🚀');
    
    let pollInterval = null;
    
    try {
        // Send request to backend to start conversion
        // Updated to use 'youtube_url' instead of 'url'
        const requestBody = {
            youtube_url: youtubeUrl,
            format: audioFormat
        };
               
        const response = await fetch(`${API_URL}/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            let errorMsg = 'Error during conversion';
            try {
                const responseText = await response.text();
                if (responseText) {
                    const errorData = JSON.parse(responseText);
                    errorMsg = errorData.error || errorMsg;
                } else {
                    errorMsg = `Error ${response.status}: ${response.statusText}`;
                }
            } catch (e) {
                errorMsg = `Error ${response.status}: ${response.statusText}`;
            }
            showError(errorMsg);
            setLoading(false);
            hideProgress();
            return;
        }
        
        // Get response text first, then parse JSON
        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response text:', responseText);
        
        if (!responseText || responseText.trim() === '') {
            console.error('Empty response from server');
            showError('Empty response from server. Check backend logs or try again.');
            setLoading(false);
            hideProgress();
            return;
        }
        
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('Parsed data:', data);
        } catch (e) {
            console.error('JSON parse error:', e);
            console.error('Response text was:', responseText);
            showError(`Invalid response from server: ${e.message}. Response: ${responseText.substring(0, 100)}`);
            setLoading(false);
            hideProgress();
            return;
        }
        const taskId = data.task_id;
        
        if (!taskId) {
            showError('Something went wrong, try again! 🤦');
            setLoading(false);
            hideProgress();
            return;
        }
        
        console.log('Task ID received:', taskId);
        console.log('Starting status polling in 500ms...');
        
        // Small delay before starting polling to avoid race condition
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Counter to handle repeated 404 errors
        let notFoundCount = 0;
        const MAX_NOT_FOUND_RETRIES = 5;
        
        // Start polling for status
        pollInterval = setInterval(async () => {
            try {
                console.log(`Polling status for task: ${taskId}`);
                const statusResponse = await fetch(`${API_URL}/status/${taskId}`);
                
                if (!statusResponse.ok) {
                    // If it's 404, might be a race condition - retry after a bit
                    if (statusResponse.status === 404) {
                        notFoundCount++;
                        console.warn(`Task ${taskId} not found (404), retry ${notFoundCount}/${MAX_NOT_FOUND_RETRIES}`);
                        
                        // If we've tried too many times, stop polling
                        if (notFoundCount >= MAX_NOT_FOUND_RETRIES) {
                            clearInterval(pollInterval);
                            showError(`Task not found after ${MAX_NOT_FOUND_RETRIES} attempts. The conversion may have failed to start.`);
                            setLoading(false);
                            hideProgress();
                            return;
                        }
                        // Otherwise continue retrying
                        return;
                    }
                    
                    // Reset counter if not 404
                    notFoundCount = 0;
                    
                    clearInterval(pollInterval);
                    let errorMsg = 'Server communication issue';
                    try {
                        const errorText = await statusResponse.text();
                        if (errorText) {
                            const errorData = JSON.parse(errorText);
                            errorMsg = errorData.error || errorMsg;
                        } else {
                            errorMsg = `Error ${statusResponse.status}: ${statusResponse.statusText}`;
                        }
                    } catch (e) {
                        errorMsg = `Error ${statusResponse.status}: ${statusResponse.statusText}`;
                    }
                    showError(errorMsg);
                    setLoading(false);
                    hideProgress();
                    return;
                }
                
                const status = await statusResponse.json();
                
                // Update progress bar and message
                updateProgress(status.progress, status.message || 'Processing...');
                
                // Updated to check for 'done' instead of 'completed'
                if (status.status === 'done') {
                    clearInterval(pollInterval);
                    
                    // Download the file
                    try {
                        const downloadResponse = await fetch(`${API_URL}/download/${taskId}`);
                        
                        if (!downloadResponse.ok) {
                            throw new Error('Download issue, try again!');
                        }
                        
                        const blob = await downloadResponse.blob();
                        // Get filename from file_path or use default
                        const filename = status.file_path 
                            ? status.file_path.split('/').pop() 
                            : `audio.${audioFormat}`;
                        
                        downloadFile(blob, filename);
                        
                        showSuccess(`Done! Your ${audioFormat.toUpperCase()} file is ready! 🎵`);
                        setLoading(false);
                        
                        // Reset form after 3 seconds
                        setTimeout(() => {
                            form.reset();
                            hideMessages();
                            hideProgress();
                        }, 3000);
                        
                    } catch (error) {
                        console.error('Download error:', error);
                        showError(`Download failed: ${error.message} 😅`);
                        setLoading(false);
                        hideProgress();
                    }
                    
                } else if (status.status === 'error') {
                    clearInterval(pollInterval);
                    const errorMsg = status.error || 'Something went wrong during conversion';
                    showError(errorMsg.includes('playlist') ? 'No playlists, single videos only! 🙄' : `😬 ${errorMsg}`);
                    setLoading(false);
                    hideProgress();
                }
                
            } catch (error) {
                console.error('Polling error:', error);
                clearInterval(pollInterval);
                showError('Server not responding, make sure it\'s running! 🤷');
                setLoading(false);
                hideProgress();
            }
        }, 500); // Poll every 500ms
        
    } catch (error) {
        console.error('Error:', error);
        
        if (pollInterval) {
            clearInterval(pollInterval);
        }
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showError('Server not responding! Make sure it\'s running on http://localhost:5000 🔌');
        } else {
            showError(`Oops! ${error.message} 😅`);
        }
        
        setLoading(false);
        hideProgress();
    }
});

// Check server status on startup (silent, no error display)
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            console.log('✅ Server connected');
        }
    } catch (error) {
        console.warn('⚠️ Server unreachable:', error);
        // Don't show error on startup, only in console
    }
}

// Check server status when page loads
window.addEventListener('load', () => {
    checkServerStatus();
});

