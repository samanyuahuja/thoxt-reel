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
let overlayItems = [];
let selectedOverlay = null;
let dragOffset = { x: 0, y: 0 };
let touchStartDistance = 0;

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
        
        // Use canvas recording if mirror mode, filters, or overlays are active
        if (isMirrored || currentFilter !== 'none' || overlayItems.length > 0) {
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
                        case 'blackwhite':
                            canvasContext.filter = 'grayscale(100%)';
                            break;
                    }
                }
                
                // Draw overlays (text and stickers) on canvas
                overlayItems.forEach(item => {
                    if (item.type === 'text') {
                        canvasContext.font = `${item.size}px ${item.font}`;
                        canvasContext.fillStyle = item.color;
                        canvasContext.fillText(item.content, item.x, item.y);
                    } else if (item.type === 'sticker') {
                        canvasContext.font = `${item.size}px Arial`;
                        canvasContext.fillText(item.content, item.x, item.y);
                    }
                });
                
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
        case 'blackwhite':
            filterValue = 'grayscale(100%)';
            break;
        case 'none':
        default:
            filterValue = 'none';
            break;
    }
    
    videoPreview.style.filter = filterValue;
}

// Sidebar section handlers
function openPanel(sectionName) {
    // Close all panels first
    document.querySelectorAll('.section-panel').forEach(panel => {
        panel.style.display = 'none';
    });
    
    // Remove active state from all sections
    document.querySelectorAll('.sidebar-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Open selected panel
    const panel = document.getElementById(`panel-${sectionName}`);
    if (panel) {
        panel.style.display = 'block';
        
        // Mark section as active
        const section = document.querySelector(`[data-section="${sectionName}"]`);
        if (section) section.classList.add('active');
    }
}

function closePanel(sectionName) {
    const panel = document.getElementById(`panel-${sectionName}`);
    if (panel) {
        panel.style.display = 'none';
    }
    
    // Remove active state
    const section = document.querySelector(`[data-section="${sectionName}"]`);
    if (section) section.classList.remove('active');
}

// Sidebar section click handlers
document.querySelectorAll('.sidebar-section').forEach(section => {
    section.addEventListener('click', () => {
        const sectionName = section.dataset.section;
        openPanel(sectionName);
    });
});

// Panel close button handlers
document.querySelectorAll('.panel-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const panel = btn.closest('.section-panel');
        if (panel) {
            panel.style.display = 'none';
            
            // Remove active from sections
            document.querySelectorAll('.sidebar-section').forEach(s => s.classList.remove('active'));
        }
    });
});

// Filter item click handlers (for panel)
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

// Text overlay functionality
const addTextBtn = document.getElementById('add-text-btn');
const textInput = document.getElementById('text-input');
const textFont = document.getElementById('text-font');
const textSize = document.getElementById('text-size');
const textSizeDisplay = document.getElementById('text-size-display');
const textColor = document.getElementById('text-color');
const overlayContainer = document.getElementById('overlay-container');

// Update size display
if (textSize && textSizeDisplay) {
    textSize.addEventListener('input', () => {
        textSizeDisplay.textContent = textSize.value + 'px';
    });
}

const stickerSize = document.getElementById('sticker-size');
const stickerSizeDisplay = document.getElementById('sticker-size-display');

if (stickerSize && stickerSizeDisplay) {
    stickerSize.addEventListener('input', () => {
        stickerSizeDisplay.textContent = stickerSize.value + 'px';
    });
}

if (addTextBtn) {
    addTextBtn.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (text) {
            addTextOverlay(text, textFont.value, parseInt(textSize.value), textColor.value);
            textInput.value = '';
        }
    });
}

function addTextOverlay(text, font, size, color) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-item overlay-text';
    overlay.textContent = text;
    overlay.style.fontFamily = font;
    overlay.style.fontSize = size + 'px';
    overlay.style.color = color;
    overlay.style.left = '50%';
    overlay.style.top = '30%';
    overlay.style.transform = 'translate(-50%, -50%)';
    
    overlayContainer.appendChild(overlay);
    
    // Calculate actual position after adding to DOM
    setTimeout(() => {
        const rect = overlay.getBoundingClientRect();
        const containerRect = overlayContainer.getBoundingClientRect();
        const x = rect.left - containerRect.left;
        const y = rect.top - containerRect.top + size; // Add size for baseline
        
        const overlayData = {
            type: 'text',
            content: text,
            font: font,
            size: size,
            color: color,
            x: x,
            y: y,
            element: overlay
        };
        
        overlayItems.push(overlayData);
        makeDraggable(overlay, overlayData);
    }, 0);
}

// Sticker functionality
document.querySelectorAll('.sticker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const sticker = btn.dataset.sticker;
        const size = parseInt(stickerSize.value);
        addStickerOverlay(sticker, size);
    });
});

function addStickerOverlay(sticker, size) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay-item overlay-sticker';
    overlay.textContent = sticker;
    overlay.style.fontSize = size + 'px';
    overlay.style.left = '50%';
    overlay.style.top = '50%';
    overlay.style.transform = 'translate(-50%, -50%)';
    
    overlayContainer.appendChild(overlay);
    
    // Calculate actual position after adding to DOM
    setTimeout(() => {
        const rect = overlay.getBoundingClientRect();
        const containerRect = overlayContainer.getBoundingClientRect();
        const x = rect.left - containerRect.left;
        const y = rect.top - containerRect.top + size; // Add size for baseline
        
        const overlayData = {
            type: 'sticker',
            content: sticker,
            size: size,
            x: x,
            y: y,
            element: overlay
        };
        
        overlayItems.push(overlayData);
        makeDraggable(overlay, overlayData);
    }, 0);
}

// Make overlay draggable
function makeDraggable(element, data) {
    let isDragging = false;
    
    // Mouse events
    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        selectedOverlay = element;
        element.classList.add('selected');
        
        const rect = element.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging && selectedOverlay === element) {
            const containerRect = overlayContainer.getBoundingClientRect();
            let x = e.clientX - containerRect.left - dragOffset.x;
            let y = e.clientY - containerRect.top - dragOffset.y;
            
            element.style.left = x + 'px';
            element.style.top = y + 'px';
            element.style.transform = 'none';
            
            // Update data coordinates (add size for text baseline)
            data.x = x;
            data.y = y + data.size;
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            if (selectedOverlay) {
                selectedOverlay.classList.remove('selected');
                selectedOverlay = null;
            }
        }
    });
    
    // Touch events
    element.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        isDragging = true;
        selectedOverlay = element;
        element.classList.add('selected');
        
        const rect = element.getBoundingClientRect();
        dragOffset.x = touch.clientX - rect.left;
        dragOffset.y = touch.clientY - rect.top;
        
        // Pinch to zoom
        if (e.touches.length === 2) {
            const distance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchStartDistance = distance;
        }
        
        e.preventDefault();
    });
    
    element.addEventListener('touchmove', (e) => {
        if (isDragging && selectedOverlay === element) {
            // Pinch to zoom
            if (e.touches.length === 2) {
                const distance = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                
                const scale = distance / touchStartDistance;
                const newSize = Math.max(20, Math.min(200, data.size * scale));
                
                element.style.fontSize = newSize + 'px';
                data.size = newSize;
                touchStartDistance = distance;
            } else {
                // Drag
                const touch = e.touches[0];
                const containerRect = overlayContainer.getBoundingClientRect();
                let x = touch.clientX - containerRect.left - dragOffset.x;
                let y = touch.clientY - containerRect.top - dragOffset.y;
                
                element.style.left = x + 'px';
                element.style.top = y + 'px';
                element.style.transform = 'none';
                
                // Update data coordinates (add size for text baseline)
                data.x = x;
                data.y = y + data.size;
            }
        }
        e.preventDefault();
    });
    
    element.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            if (selectedOverlay) {
                selectedOverlay.classList.remove('selected');
                selectedOverlay = null;
            }
        }
        touchStartDistance = 0;
    });
}

// Mirror toggle in panel
const toggleMirrorBtn = document.getElementById('toggle-mirror-btn');
const mirrorStatus = document.getElementById('mirror-status');
if (toggleMirrorBtn) {
    toggleMirrorBtn.addEventListener('click', () => {
        isMirrored = !isMirrored;
        videoPreview.style.transform = isMirrored ? 'scaleX(-1)' : 'scaleX(1)';
        if (mirrorStatus) {
            mirrorStatus.textContent = isMirrored ? 'Mirror: ON' : 'Mirror: OFF';
        }
    });
}

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
        
        // Redirect to saved reels page
        window.location.href = '/saved-reels';
        
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
