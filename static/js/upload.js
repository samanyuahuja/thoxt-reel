let uploadedFile = null;
let videoBlob = null;

const uploadBox = document.getElementById('upload-box');
const fileInput = document.getElementById('file-input');
const previewSection = document.getElementById('preview-section');
const previewVideo = document.getElementById('preview-video');
const videoTitle = document.getElementById('video-title');

uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#ffd700';
    uploadBox.style.background = 'rgba(255, 215, 0, 0.1)';
});

uploadBox.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#444';
    uploadBox.style.background = '#1a1a1a';
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#444';
    uploadBox.style.background = '#1a1a1a';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
    }
});

function handleFileSelect(file) {
    if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file');
        return;
    }
    
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('File size must be less than 100MB');
        return;
    }
    
    uploadedFile = file;
    videoBlob = file;
    
    const videoURL = URL.createObjectURL(file);
    previewVideo.src = videoURL;
    
    uploadBox.style.display = 'none';
    previewSection.style.display = 'block';
    
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    videoTitle.value = fileName;
}

function cancelUpload() {
    uploadedFile = null;
    videoBlob = null;
    previewVideo.src = '';
    videoTitle.value = '';
    
    uploadBox.style.display = 'flex';
    previewSection.style.display = 'none';
    fileInput.value = '';
}

async function saveUploadedVideo() {
    const title = videoTitle.value.trim() || 'Uploaded Video';
    const duration = Math.floor(previewVideo.duration) || 0;
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
            videoBlob: videoBlob,
            thumbnail: thumbnail,
            views: 0,
            likes: 0,
            createdAt: new Date().toISOString()
        };
        
        await store.add(reel);
        
        console.log('Uploaded video saved successfully:', reelId);
        
        window.location.href = `/editor?id=${reelId}`;
        
    } catch (error) {
        console.error('Error saving uploaded video:', error);
        alert('Error saving video. Please try again.');
    }
}

function generateThumbnail() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 427;
        const ctx = canvas.getContext('2d');
        
        previewVideo.addEventListener('loadeddata', () => {
            previewVideo.currentTime = 1;
        }, { once: true });
        
        previewVideo.addEventListener('seeked', () => {
            ctx.drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
        }, { once: true });
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
