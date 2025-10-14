// Global variables
let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingStartTime = 0;
let timerInterval = null;
let isMirrored = false;
let showTeleprompter = false;
let currentFilter = 'none';
let recordedBlob = null;
let canvasRecordingInterval = null;

// DOM elements
const videoPreview = document.getElementById('video-preview');
const recordingCanvas = document.getElementById('recording-canvas');
const canvasContext = recordingCanvas.getContext('2d');
const recordBtn = document.getElementById('record-btn');
const stopBtn = document.getElementById('stop-btn');
const mirrorBtn = document.getElementById('mirror-btn');
const teleprompterBtn = document.getElementById('teleprompter-btn');
const filterBtn = document.getElementById('filter-btn');
const timerDisplay = document.getElementById('timer');
const teleprompterOverlay = document.getElementById('teleprompter-overlay');
const saveModal = document.getElementById('save-modal');
const reelTitleInput = document.getElementById('reel-title');
const saveReelBtn = document.getElementById('save-reel-btn');
const cancelSaveBtn = document.getElementById('cancel-save-btn');

// Initialize camera
async function initCamera() {
    try {
        const constraints = {
            video: {
                width: { ideal: 1080 },
                height: { ideal: 1920 },
                facingMode: 'user'
            },
            audio: true
        };
        
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoPreview.srcObject = mediaStream;
        
        console.log('Camera initialized successfully');
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Could not access camera. Please check permissions.');
    }
}

// Start recording
async function startRecording() {
    recordedChunks = [];
    recordingStartTime = Date.now();
    
    try {
        let streamToRecord;
        
        // Use canvas recording if mirror mode or filters are active
        if (isMirrored || currentFilter !== 'none') {
            // Setup canvas for recording
            recordingCanvas.width = videoPreview.videoWidth || 1080;
            recordingCanvas.height = videoPreview.videoHeight || 1920;
            
            // Start drawing video to canvas with transformations
            canvasRecordingInterval = setInterval(() => {
                canvasContext.save();
                
                // Apply mirror transform if needed
                if (isMirrored) {
                    canvasContext.translate(recordingCanvas.width, 0);
                    canvasContext.scale(-1, 1);
                }
                
                // Apply filter if needed
                if (currentFilter !== 'none') {
                    switch (currentFilter) {
                        case 'valencia':
                            canvasContext.filter = 'contrast(1.08) brightness(1.08) sepia(0.08)';
                            break;
                        case 'nashville':
                            canvasContext.filter = 'sepia(0.2) contrast(1.2) brightness(1.05) saturate(1.2)';
                            break;
                        case 'toaster':
                            canvasContext.filter = 'contrast(1.5) brightness(0.9) sepia(0.1)';
                            break;
                        case 'walden':
                            canvasContext.filter = 'brightness(1.1) hue-rotate(-10deg) sepia(0.3) saturate(1.6)';
                            break;
                        case 'lofi':
                            canvasContext.filter = 'saturate(1.1) contrast(1.5)';
                            break;
                        case 'clarendon':
                            canvasContext.filter = 'contrast(1.2) saturate(1.35)';
                            break;
                        case 'gingham':
                            canvasContext.filter = 'brightness(1.05) hue-rotate(-10deg)';
                            break;
                    }
                }
                
                // Draw video frame
                canvasContext.drawImage(videoPreview, 0, 0, recordingCanvas.width, recordingCanvas.height);
                canvasContext.restore();
            }, 1000 / 30); // 30 fps
            
            // Get canvas stream
            const canvasStream = recordingCanvas.captureStream(30);
            
            // Add audio from original stream
            const audioTracks = mediaStream.getAudioTracks();
            audioTracks.forEach(track => canvasStream.addTrack(track));
            
            streamToRecord = canvasStream;
        } else {
            // Use direct camera stream if no effects
            streamToRecord = mediaStream;
        }
        
        mediaRecorder = new MediaRecorder(streamToRecord, {
            mimeType: 'video/webm;codecs=vp9'
        });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
            
            // Stop canvas recording if active
            if (canvasRecordingInterval) {
                clearInterval(canvasRecordingInterval);
                canvasRecordingInterval = null;
            }
            
            showSaveModal();
        };
        
        mediaRecorder.start(100);
        
        recordBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
        timerDisplay.style.display = 'block';
        
        startTimer();
        
        console.log('Recording started' + (isMirrored ? ' with mirror effect' : '') + (currentFilter !== 'none' ? ' with filter' : ''));
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Could not start recording');
    }
}

// Stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        stopTimer();
        
        recordBtn.style.display = 'flex';
        stopBtn.style.display = 'none';
        
        console.log('Recording stopped');
    }
}

// Timer functions
function startTimer() {
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// Mirror toggle
function toggleMirror() {
    isMirrored = !isMirrored;
    videoPreview.style.transform = isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
    mirrorBtn.classList.toggle('active', isMirrored);
}

// Teleprompter toggle
function toggleTeleprompter() {
    showTeleprompter = !showTeleprompter;
    teleprompterOverlay.style.display = showTeleprompter ? 'block' : 'none';
    teleprompterBtn.classList.toggle('active', showTeleprompter);
}

// Instagram-style filters
function applyFilter(filterName) {
    currentFilter = filterName;
    let filterValue = 'none';
    
    switch (filterName) {
        case 'valencia':
            filterValue = 'contrast(1.08) brightness(1.08) sepia(0.08)';
            break;
        case 'nashville':
            filterValue = 'sepia(0.2) contrast(1.2) brightness(1.05) saturate(1.2)';
            break;
        case 'toaster':
            filterValue = 'contrast(1.5) brightness(0.9) sepia(0.1)';
            break;
        case 'walden':
            filterValue = 'brightness(1.1) hue-rotate(-10deg) sepia(0.3) saturate(1.6)';
            break;
        case 'lofi':
            filterValue = 'saturate(1.1) contrast(1.5)';
            break;
        case 'clarendon':
            filterValue = 'contrast(1.2) saturate(1.35)';
            break;
        case 'gingham':
            filterValue = 'brightness(1.05) hue-rotate(-10deg)';
            break;
        case 'none':
        default:
            filterValue = 'none';
            break;
    }
    
    videoPreview.style.filter = filterValue;
}

// Filter item click handlers
document.querySelectorAll('.filter-item').forEach(item => {
    item.addEventListener('click', () => {
        const filterName = item.dataset.filter;
        
        // Update active state
        document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Apply filter
        applyFilter(filterName);
    });
});

// Save modal
function showSaveModal() {
    saveModal.style.display = 'flex';
    reelTitleInput.value = 'My Reel ' + new Date().toLocaleString();
    reelTitleInput.focus();
}

function hideSaveModal() {
    saveModal.style.display = 'none';
}

// Save reel to IndexedDB
async function saveReel() {
    const title = reelTitleInput.value.trim() || 'Untitled Reel';
    const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
    const reelId = 'reel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    try {
        // Open IndexedDB
        const db = await openDB();
        const transaction = db.transaction(['reels'], 'readwrite');
        const store = transaction.objectStore('reels');
        
        // Generate thumbnail
        const thumbnail = await generateThumbnail();
        
        // Save reel
        const reel = {
            id: reelId,
            title: title,
            duration: duration,
            videoBlob: recordedBlob,
            thumbnail: thumbnail,
            views: 0,
            likes: 0,
            createdAt: new Date().toISOString()
        };
        
        await store.add(reel);
        
        console.log('Reel saved successfully:', reelId);
        
        hideSaveModal();
        
        // Redirect to editor to apply effects
        window.location.href = `/editor?id=${reelId}`;
        
    } catch (error) {
        console.error('Error saving reel:', error);
        alert('Error saving reel');
    }
}

// Generate thumbnail from video
function generateThumbnail() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 427;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
    });
}

// IndexedDB operations
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ThoxtReelsDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('reels')) {
                db.createObjectStore('reels', { keyPath: 'id' });
            }
        };
    });
}

// Event listeners
recordBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
mirrorBtn.addEventListener('click', toggleMirror);
teleprompterBtn.addEventListener('click', toggleTeleprompter);
saveReelBtn.addEventListener('click', saveReel);
cancelSaveBtn.addEventListener('click', () => {
    hideSaveModal();
    recordedBlob = null;
    recordedChunks = [];
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initCamera();
    
    // Check if teleprompter mode is enabled
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('teleprompter') === 'true') {
        setTimeout(() => toggleTeleprompter(), 500);
    }
});
