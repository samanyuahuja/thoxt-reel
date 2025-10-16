let video = null;
let currentFilter = 'none';
let textOverlays = [];
let stickers = [];
let selectedMusic = null;
let isDrawing = false;
let drawingPaths = [];
let currentAnimation = 'none';
let comparisonMode = false;

const previewVideoOriginal = document.getElementById('preview-video-original');
const previewVideo = document.getElementById('preview-video');
const editorCanvas = document.getElementById('editor-canvas');
const drawingCanvas = document.getElementById('drawing-canvas');
const playPauseBtn = document.getElementById('play-pause-btn');
const timelineSlider = document.getElementById('timeline-slider');
const timeDisplay = document.getElementById('time-display');
const comparisonSlider = document.getElementById('comparison-slider');
const filterComparison = document.getElementById('filter-comparison');
const textInput = document.getElementById('text-input');
const fontSelect = document.getElementById('font-select');
const fontSize = document.getElementById('font-size');
const textColor = document.getElementById('text-color');
const drawColor = document.getElementById('draw-color');
const brushSize = document.getElementById('brush-size');
const musicVolume = document.getElementById('music-volume');

async function loadVideoFromStorage() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const reelId = urlParams.get('id');
        
        if (!reelId) {
            alert('No reel selected');
            window.location.href = '/saved-reels';
            return;
        }
        
        const db = await openDB();
        const transaction = db.transaction(['reels'], 'readonly');
        const store = transaction.objectStore('reels');
        const request = store.get(reelId);
        
        request.onsuccess = () => {
            const reel = request.result;
            if (reel && reel.videoBlob) {
                const videoURL = URL.createObjectURL(reel.videoBlob);
                previewVideoOriginal.src = videoURL;
                previewVideo.src = videoURL;
                previewVideoOriginal.load();
                previewVideo.load();
                setupCanvas();
                
                previewVideo.addEventListener('play', () => previewVideoOriginal.play());
                previewVideo.addEventListener('pause', () => previewVideoOriginal.pause());
                previewVideo.addEventListener('seeked', () => {
                    previewVideoOriginal.currentTime = previewVideo.currentTime;
                });
                
                previewVideo.addEventListener('timeupdate', () => {
                    const drift = Math.abs(previewVideo.currentTime - previewVideoOriginal.currentTime);
                    if (drift > 0.1) {
                        previewVideoOriginal.currentTime = previewVideo.currentTime;
                    }
                });
            } else {
                alert('Video not found');
                window.location.href = '/saved-reels';
            }
        };
        
        request.onerror = () => {
            alert('Error loading video');
            window.location.href = '/saved-reels';
        };
    } catch (error) {
        console.error('Error loading video:', error);
        alert('Error loading video');
    }
}

function setupCanvas() {
    const width = previewVideo.videoWidth || 1080;
    const height = previewVideo.videoHeight || 1920;
    editorCanvas.width = width;
    editorCanvas.height = height;
    drawingCanvas.width = width;
    drawingCanvas.height = height;
}

document.querySelectorAll('.editor-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetPanel = tab.dataset.tab;
        
        document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
        document.getElementById(`panel-${targetPanel}`).classList.add('active');
    });
});

document.querySelectorAll('.filter-option').forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        applyFilter(currentFilter);
        
        document.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

function applyFilter(filter) {
    let filterCSS = 'none';
    
    switch(filter) {
        case 'valencia':
            filterCSS = 'contrast(1.08) brightness(1.08) sepia(0.08)';
            break;
        case 'nashville':
            filterCSS = 'sepia(0.2) contrast(1.2) brightness(1.05) saturate(1.2)';
            break;
        case 'toaster':
            filterCSS = 'contrast(1.5) brightness(0.9) sepia(0.1)';
            break;
        case 'walden':
            filterCSS = 'brightness(1.1) hue-rotate(-10deg) sepia(0.3) saturate(1.6)';
            break;
        case 'lofi':
            filterCSS = 'saturate(1.1) contrast(1.5)';
            break;
        case 'clarendon':
            filterCSS = 'contrast(1.2) saturate(1.35)';
            break;
        case 'gingham':
            filterCSS = 'brightness(1.05) hue-rotate(-10deg)';
            break;
    }
    
    previewVideo.style.filter = filterCSS;
    editorCanvas.style.filter = filterCSS;
}

function toggleComparison() {
    comparisonMode = !comparisonMode;
    filterComparison.style.display = comparisonMode ? 'block' : 'none';
    
    if (comparisonMode) {
        updateComparison(50);
        comparisonSlider.value = 50;
    } else {
        previewVideo.style.clipPath = '';
    }
}

comparisonSlider.addEventListener('input', (e) => {
    updateComparison(e.target.value);
});

function updateComparison(value) {
    const percentage = value / 100;
    previewVideo.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
}

function addTextOverlay() {
    const text = textInput.value.trim();
    if (!text) return;
    
    const overlay = {
        id: Date.now(),
        text: text,
        font: fontSelect.value,
        size: fontSize.value,
        color: textColor.value,
        animation: currentAnimation,
        x: 50,
        y: 50
    };
    
    textOverlays.push(overlay);
    renderTextOverlay(overlay);
    textInput.value = '';
}

function renderTextOverlay(overlay) {
    const div = document.createElement('div');
    div.className = 'text-overlay';
    div.dataset.id = overlay.id;
    div.dataset.testid = `text-overlay-${overlay.id}`;
    div.style.fontFamily = overlay.font;
    div.style.fontSize = overlay.size + 'px';
    div.style.color = overlay.color;
    div.style.left = overlay.x + '%';
    div.style.top = overlay.y + '%';
    div.textContent = overlay.text;
    
    if (overlay.animation !== 'none') {
        div.classList.add(`anim-${overlay.animation}`);
    }
    
    div.draggable = true;
    div.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', overlay.id);
    });
    
    div.addEventListener('dragend', (e) => {
        const rect = document.querySelector('.video-preview-container').getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        overlay.x = Math.max(0, Math.min(100, x));
        overlay.y = Math.max(0, Math.min(100, y));
        div.style.left = overlay.x + '%';
        div.style.top = overlay.y + '%';
    });
    
    document.getElementById('text-overlays').appendChild(div);
}

document.querySelectorAll('.animation-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentAnimation = btn.dataset.animation;
        document.querySelectorAll('.animation-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

document.querySelectorAll('.music-track').forEach(track => {
    track.addEventListener('click', () => {
        selectedMusic = track.dataset.track;
        document.querySelectorAll('.music-track').forEach(t => t.classList.remove('active'));
        track.classList.add('active');
    });
});

document.querySelectorAll('.sticker-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        addSticker(btn.dataset.sticker);
    });
});

function addSticker(emoji) {
    const sticker = {
        id: Date.now(),
        emoji: emoji,
        x: 50,
        y: 50,
        scale: 1
    };
    
    stickers.push(sticker);
    renderSticker(sticker);
}

function renderSticker(sticker) {
    const div = document.createElement('div');
    div.className = 'sticker';
    div.dataset.id = sticker.id;
    div.dataset.testid = `sticker-${sticker.id}`;
    div.textContent = sticker.emoji;
    div.style.left = sticker.x + '%';
    div.style.top = sticker.y + '%';
    div.style.transform = `scale(${sticker.scale})`;
    
    div.draggable = true;
    div.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', sticker.id);
    });
    
    div.addEventListener('dragend', (e) => {
        const rect = document.querySelector('.video-preview-container').getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        sticker.x = Math.max(0, Math.min(100, x));
        sticker.y = Math.max(0, Math.min(100, y));
        div.style.left = sticker.x + '%';
        div.style.top = sticker.y + '%';
    });
    
    document.getElementById('stickers-container').appendChild(div);
}

const drawCtx = drawingCanvas.getContext('2d');

drawingCanvas.addEventListener('mousedown', startDrawing);
drawingCanvas.addEventListener('mousemove', draw);
drawingCanvas.addEventListener('mouseup', stopDrawing);
drawingCanvas.addEventListener('mouseleave', stopDrawing);

function startDrawing(e) {
    if (document.querySelector('[data-tab="draw"]').classList.contains('active')) {
        isDrawing = true;
        const rect = drawingCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        drawingPaths.push({ points: [{ x, y }], color: drawColor.value, size: brushSize.value });
    }
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = drawingCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const currentPath = drawingPaths[drawingPaths.length - 1];
    currentPath.points.push({ x, y });
    
    redrawCanvas();
}

function stopDrawing() {
    isDrawing = false;
}

function redrawCanvas() {
    drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    drawingPaths.forEach(path => {
        if (path.points.length < 2) return;
        
        drawCtx.strokeStyle = path.color;
        drawCtx.lineWidth = path.size;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
        
        drawCtx.beginPath();
        drawCtx.moveTo(path.points[0].x, path.points[0].y);
        
        for (let i = 1; i < path.points.length; i++) {
            drawCtx.lineTo(path.points[i].x, path.points[i].y);
        }
        
        drawCtx.stroke();
    });
}

function clearDrawing() {
    drawingPaths = [];
    drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}

let transcriptSegments = [];

async function generateTranscript() {
    
    alert('AI Transcript requires backend speech-to-text API integration. The caption application system is ready once API is configured.');
}

function applyCaptions() {
    if (transcriptSegments.length === 0) {
        alert('No transcript available to apply as captions');
        return;
    }
    
    transcriptSegments.forEach((segment, index) => {
        const overlay = {
            id: Date.now() + index,
            text: segment.text,
            font: 'Arial',
            size: 32,
            color: '#ffffff',
            animation: 'fade',
            x: 50,
            y: 80 + (index * 10)
        };
        
        textOverlays.push(overlay);
        renderTextOverlay(overlay);
    });
    
    alert(`${transcriptSegments.length} caption(s) applied to video!`);
}

playPauseBtn.addEventListener('click', () => {
    if (previewVideo.paused) {
        previewVideo.play();
        playPauseBtn.textContent = '⏸';
    } else {
        previewVideo.pause();
        playPauseBtn.textContent = '▶';
    }
});

previewVideo.addEventListener('timeupdate', () => {
    const percentage = (previewVideo.currentTime / previewVideo.duration) * 100;
    timelineSlider.value = percentage;
    
    const currentMinutes = Math.floor(previewVideo.currentTime / 60);
    const currentSeconds = Math.floor(previewVideo.currentTime % 60);
    const totalMinutes = Math.floor(previewVideo.duration / 60);
    const totalSeconds = Math.floor(previewVideo.duration % 60);
    
    timeDisplay.textContent = `${currentMinutes}:${String(currentSeconds).padStart(2, '0')} / ${totalMinutes}:${String(totalSeconds).padStart(2, '0')}`;
});

timelineSlider.addEventListener('input', (e) => {
    const time = (e.target.value / 100) * previewVideo.duration;
    previewVideo.currentTime = time;
});

async function exportReel() {
    alert('Export functionality would render video with all effects and save to IndexedDB');
}

function confirmExit() {
    if (confirm('Are you sure you want to exit? Unsaved changes will be lost.')) {
        window.location.href = '/saved-reels';
    }
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

document.addEventListener('DOMContentLoaded', () => {
    loadVideoFromStorage();
});
