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
let currentFacingMode = 'user';
let teleprompterWords = [];
let currentWordIndex = 0;
let teleprompterInterval = null;

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

function updateVideoTransform() {
    let transform = 'translate(-50%, -50%)';

    if (isMirrored) {
        transform += ' scaleX(-1)';
    }

    videoPreview.style.transform = transform;
}

async function initCamera() {
    try {
        const constraints = {
            video: {
                width: { ideal: 1080 },
                height: { ideal: 1920 },
                facingMode: currentFacingMode
            },
            audio: true
        };
        
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoPreview.srcObject = mediaStream;
        
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('portrait').catch(() => {});
        }
        
        await new Promise(resolve => {
            videoPreview.onloadedmetadata = () => {
                videoPreview.play();
                updateVideoTransform();
                resolve();
            };
        });
        
        console.log('Camera initialized successfully');
        console.log('Camera mode:', currentFacingMode);
        console.log('Video dimensions:', videoPreview.videoWidth, 'x', videoPreview.videoHeight);
        
        updateVideoTransform();
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Could not access camera. Please check permissions.');
    }
}

async function startRecording() {
    if (showTeleprompter && teleprompterWords.length > 0) {
        startTeleprompterHighlight();
    }
    
    if (!mediaStream) {
        alert('Camera not initialized. Please wait a moment and try again.');
        return;
    }
    
    recordedChunks = [];
    recordingStartTime = Date.now();
    
    try {
        let streamToRecord;
        
        if (isMirrored || currentFilter !== 'none' || overlayItems.length > 0) {
            recordingCanvas.width = 1080;
            recordingCanvas.height = 1920;
            
            console.log('Canvas recording mode activated');
            console.log('Canvas size:', recordingCanvas.width, 'x', recordingCanvas.height);
            console.log('Overlay items:', overlayItems.length);
            
            canvasRecordingInterval = setInterval(() => {
                canvasContext.save();
                
                if (isMirrored) {
                    canvasContext.translate(recordingCanvas.width, 0);
                    canvasContext.scale(-1, 1);
                }
                
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
                
                canvasContext.drawImage(videoPreview, 0, 0, recordingCanvas.width, recordingCanvas.height);
                
                canvasContext.filter = 'none';
                canvasContext.restore();
                
                canvasContext.save();
                
                if (isMirrored) {
                    canvasContext.translate(recordingCanvas.width, 0);
                    canvasContext.scale(-1, 1);
                }
                
                canvasContext.textAlign = 'center';
                canvasContext.textBaseline = 'middle';
                
                const overlayContainer = document.getElementById('overlay-container');
                const containerRect = overlayContainer.getBoundingClientRect();
                const scaleX = 1080 / containerRect.width;
                const scaleY = 1920 / containerRect.height;
                const scaleFactor = Math.min(scaleX, scaleY);
                
                overlayItems.forEach(item => {
                    const drawX = item.relX * 1080;
                    const drawY = item.relY * 1920;
                    
                    console.log('Drawing overlay:', item.type, 'at', drawX.toFixed(0), drawY.toFixed(0));
                    
                    const scaledSize = item.size * scaleFactor;
                    
                    if (item.type === 'text') {
                        canvasContext.font = `${scaledSize}px ${item.font}`;
                        canvasContext.fillStyle = item.color;
                        canvasContext.fillText(item.content, drawX, drawY);
                    } else if (item.type === 'sticker') {
                        canvasContext.font = `${scaledSize}px Arial`;
                        canvasContext.fillText(item.content, drawX, drawY);
                    }
                });
                canvasContext.restore();
            }, 1000 / 30);
            
            const canvasStream = recordingCanvas.captureStream(30);
            
            const audioTracks = mediaStream.getAudioTracks();
            audioTracks.forEach(track => canvasStream.addTrack(track));
            
            streamToRecord = canvasStream;
        } else {
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

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        stopTimer();
        
        stopTeleprompterHighlight();
        
        recordBtn.style.display = 'flex';
        stopBtn.style.display = 'none';
        
        console.log('Recording stopped');
    }
}

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

function toggleMirror() {
    isMirrored = !isMirrored;
    updateVideoTransform();
    mirrorBtn.classList.toggle('active', isMirrored);
}

function prepareTeleprompter(scriptText) {
    const teleprompterText = document.getElementById('teleprompter-text');
    const words = scriptText.split(/\s+/).filter(word => word.length > 0);
    
    teleprompterText.innerHTML = words.map((word, index) => 
        `<span class="word" data-word-index="${index}">${word}</span>`
    ).join(' ');
    
    teleprompterWords = words;
    currentWordIndex = 0;
}

function startTeleprompterHighlight() {
    if (teleprompterWords.length === 0) return;
    
    currentWordIndex = 0;
    
    teleprompterInterval = setInterval(() => {
        const prevWord = document.querySelector('.word.highlight');
        if (prevWord) {
            prevWord.classList.remove('highlight');
        }
        
        if (currentWordIndex < teleprompterWords.length) {
            const currentWord = document.querySelector(`[data-word-index="${currentWordIndex}"]`);
            if (currentWord) {
                currentWord.classList.add('highlight');
                
                currentWord.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }
            currentWordIndex++;
        } else {
            currentWordIndex = 0;
        }
    }, 400);
}

function stopTeleprompterHighlight() {
    if (teleprompterInterval) {
        clearInterval(teleprompterInterval);
        teleprompterInterval = null;
    }
    
    const highlightedWords = document.querySelectorAll('.word.highlight');
    highlightedWords.forEach(word => word.classList.remove('highlight'));
    currentWordIndex = 0;
}

function toggleTeleprompter() {
    showTeleprompter = !showTeleprompter;
    teleprompterOverlay.style.display = showTeleprompter ? 'block' : 'none';
    teleprompterBtn.classList.toggle('active', showTeleprompter);
}

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

function openPanel(sectionName) {
    document.querySelectorAll('.section-panel').forEach(panel => {
        panel.style.display = 'none';
    });
    
    document.querySelectorAll('.sidebar-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const panel = document.getElementById(`panel-${sectionName}`);
    if (panel) {
        panel.style.display = 'block';
        
        const section = document.querySelector(`[data-section="${sectionName}"]`);
        if (section) section.classList.add('active');
    }
}

function closePanel(sectionName) {
    const panel = document.getElementById(`panel-${sectionName}`);
    if (panel) {
        panel.style.display = 'none';
    }
    
    const section = document.querySelector(`[data-section="${sectionName}"]`);
    if (section) section.classList.remove('active');
}

document.querySelectorAll('.sidebar-section').forEach(section => {
    section.addEventListener('click', () => {
        const sectionName = section.dataset.section;
        openPanel(sectionName);
    });
});

document.querySelectorAll('.panel-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const panel = btn.closest('.section-panel');
        if (panel) {
            panel.style.display = 'none';
            
            document.querySelectorAll('.sidebar-section').forEach(s => s.classList.remove('active'));
        }
    });
});

document.querySelectorAll('.filter-item').forEach(item => {
    item.addEventListener('click', () => {
        const filterName = item.dataset.filter;
        
        document.querySelectorAll('.filter-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        applyFilter(filterName);
    });
});

const addTextBtn = document.getElementById('add-text-btn');
const textInput = document.getElementById('text-input');
const textFont = document.getElementById('text-font');
const textSize = document.getElementById('text-size');
const textSizeDisplay = document.getElementById('text-size-display');
const textColor = document.getElementById('text-color');
const overlayContainer = document.getElementById('overlay-container');

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
    
    setTimeout(() => {
        const rect = overlay.getBoundingClientRect();
        const containerRect = overlayContainer.getBoundingClientRect();
        
        const xInContainer = rect.left - containerRect.left + rect.width / 2;
        const yInContainer = rect.top - containerRect.top + rect.height / 2;
        
        const relX = xInContainer / containerRect.width;
        const relY = yInContainer / containerRect.height;
        
        const overlayData = {
            type: 'text',
            content: text,
            font: font,
            size: size,
            color: color,
            relX: relX,
            relY: relY,
            element: overlay
        };
        
        console.log('Text overlay created:', overlayData.content, 'at relative position', relX.toFixed(2), relY.toFixed(2));
        
        overlayItems.push(overlayData);
        makeDraggable(overlay, overlayData);
    }, 0);
}

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
    
    setTimeout(() => {
        const rect = overlay.getBoundingClientRect();
        const containerRect = overlayContainer.getBoundingClientRect();
        
        const xInContainer = rect.left - containerRect.left + rect.width / 2;
        const yInContainer = rect.top - containerRect.top + rect.height / 2;
        
        const relX = xInContainer / containerRect.width;
        const relY = yInContainer / containerRect.height;
        
        const overlayData = {
            type: 'sticker',
            content: sticker,
            size: size,
            relX: relX,
            relY: relY,
            element: overlay
        };
        
        console.log('Sticker overlay created:', overlayData.content, 'at relative position', relX.toFixed(2), relY.toFixed(2));
        
        overlayItems.push(overlayData);
        makeDraggable(overlay, overlayData);
    }, 0);
}

function makeDraggable(element, data) {
    let isDragging = false;
    
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
            
            const elementRect = element.getBoundingClientRect();
            const xInContainer = elementRect.left - containerRect.left + elementRect.width / 2;
            const yInContainer = elementRect.top - containerRect.top + elementRect.height / 2;
            
            data.relX = xInContainer / containerRect.width;
            data.relY = yInContainer / containerRect.height;
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
    
    element.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        isDragging = true;
        selectedOverlay = element;
        element.classList.add('selected');
        
        const rect = element.getBoundingClientRect();
        dragOffset.x = touch.clientX - rect.left;
        dragOffset.y = touch.clientY - rect.top;
        
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
                const touch = e.touches[0];
                const containerRect = overlayContainer.getBoundingClientRect();
                let x = touch.clientX - containerRect.left - dragOffset.x;
                let y = touch.clientY - containerRect.top - dragOffset.y;
                
                element.style.left = x + 'px';
                element.style.top = y + 'px';
                element.style.transform = 'none';
                
                const elementRect = element.getBoundingClientRect();
                const xInContainer = elementRect.left - containerRect.left + elementRect.width / 2;
                const yInContainer = elementRect.top - containerRect.top + elementRect.height / 2;
                
                data.relX = xInContainer / containerRect.width;
                data.relY = yInContainer / containerRect.height;
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

const toggleMirrorBtn = document.getElementById('toggle-mirror-btn');
const mirrorStatus = document.getElementById('mirror-status');
if (toggleMirrorBtn) {
    toggleMirrorBtn.addEventListener('click', () => {
        isMirrored = !isMirrored;
        updateVideoTransform();
        if (mirrorStatus) {
            mirrorStatus.textContent = isMirrored ? 'Mirror: ON' : 'Mirror: OFF';
        }
    });
}

function showSaveModal() {
    saveModal.style.display = 'flex';
    reelTitleInput.value = 'My Reel ' + new Date().toLocaleString();
    reelTitleInput.focus();
}

function hideSaveModal() {
    saveModal.style.display = 'none';
}

async function saveReel() {
    const title = reelTitleInput.value.trim() || 'Untitled Reel';
    const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
    const reelId = 'reel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    try {
        const db = await openDB();
        const transaction = db.transaction(['reels'], 'readwrite');
        const store = transaction.objectStore('reels');
        
        const thumbnail = await generateThumbnail();
        
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
        
        window.location.href = '/saved-reels';
        
    } catch (error) {
        console.error('Error saving reel:', error);
        alert('Error saving reel');
    }
}

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

async function flipCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    await initCamera();
}

if (recordBtn) recordBtn.addEventListener('click', startRecording);
if (stopBtn) stopBtn.addEventListener('click', stopRecording);
if (teleprompterBtn) teleprompterBtn.addEventListener('click', toggleTeleprompter);
if (saveReelBtn) saveReelBtn.addEventListener('click', saveReel);
if (cancelSaveBtn) {
    cancelSaveBtn.addEventListener('click', () => {
        hideSaveModal();
        recordedBlob = null;
        recordedChunks = [];
    });
}
const cameraFlipBtn = document.getElementById('camera-flip-btn');
if (cameraFlipBtn) cameraFlipBtn.addEventListener('click', flipCamera);

document.addEventListener('DOMContentLoaded', () => {
    initCamera();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('teleprompter') === 'true') {
        const savedScript = sessionStorage.getItem('teleprompterScript');
        if (savedScript) {
            prepareTeleprompter(savedScript);
        }
        setTimeout(() => toggleTeleprompter(), 500);
    }
});
