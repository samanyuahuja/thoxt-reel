// Global variables
let reels = [];

// DOM elements
const reelsGrid = document.getElementById('reels-grid');

// Load reels from IndexedDB
async function loadReels() {
    try {
        const db = await openDB();
        const transaction = db.transaction(['reels'], 'readonly');
        const store = transaction.objectStore('reels');
        const request = store.getAll();
        
        request.onsuccess = () => {
            reels = request.result;
            displayReels();
        };
        
        request.onerror = () => {
            console.error('Error loading reels');
            reelsGrid.innerHTML = '<p class="loading-message">Error loading reels</p>';
        };
    } catch (error) {
        console.error('Error opening database:', error);
        reelsGrid.innerHTML = '<p class="loading-message">Error loading reels</p>';
    }
}

// Display reels in grid
function displayReels() {
    if (reels.length === 0) {
        reelsGrid.innerHTML = '<p class="loading-message">No reels yet. Create your first reel!</p>';
        return;
    }
    
    reelsGrid.innerHTML = '';
    
    reels.forEach(reel => {
        const reelCard = createReelCard(reel);
        reelsGrid.appendChild(reelCard);
    });
}

// Create reel card element
function createReelCard(reel) {
    const card = document.createElement('div');
    card.className = 'reel-card';
    card.dataset.testid = `card-reel-${reel.id}`;
    
    // Create video URL from blob
    const videoURL = URL.createObjectURL(reel.videoBlob);
    
    card.innerHTML = `
        <div class="reel-video-container">
            <video 
                class="reel-video" 
                src="${videoURL}"
                poster="${reel.thumbnail || ''}"
                controls
                playsinline
                data-testid="video-reel-${reel.id}"
            ></video>
        </div>
        <div class="reel-info">
            <h3 class="reel-title" data-testid="text-title-${reel.id}">${reel.title}</h3>
            <div class="reel-stats">
                <span data-testid="text-views-${reel.id}">👁️ ${reel.views} views</span>
                <span data-testid="text-likes-${reel.id}">❤️ ${reel.likes} likes</span>
                <span data-testid="text-duration-${reel.id}">⏱️ ${reel.duration}s</span>
            </div>
            <div class="reel-actions">
                <button class="action-btn download" onclick="downloadReel('${reel.id}')" data-testid="button-download-${reel.id}">
                    ⬇️ Download
                </button>
                <button class="action-btn delete" onclick="deleteReel('${reel.id}')" data-testid="button-delete-${reel.id}">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `;
    
    // Update views when video plays
    const video = card.querySelector('video');
    video.addEventListener('play', () => updateViews(reel.id));
    
    return card;
}

// Update views
async function updateViews(reelId) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['reels'], 'readwrite');
        const store = transaction.objectStore('reels');
        const request = store.get(reelId);
        
        request.onsuccess = () => {
            const reel = request.result;
            if (reel) {
                reel.views += 1;
                store.put(reel);
            }
        };
    } catch (error) {
        console.error('Error updating views:', error);
    }
}

// Download reel
async function downloadReel(reelId) {
    try {
        const db = await openDB();
        const transaction = db.transaction(['reels'], 'readonly');
        const store = transaction.objectStore('reels');
        const request = store.get(reelId);
        
        request.onsuccess = () => {
            const reel = request.result;
            if (reel && reel.videoBlob) {
                const url = URL.createObjectURL(reel.videoBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${reel.title}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        };
    } catch (error) {
        console.error('Error downloading reel:', error);
        alert('Error downloading reel');
    }
}

// Delete reel
async function deleteReel(reelId) {
    if (!confirm('Are you sure you want to delete this reel?')) {
        return;
    }
    
    try {
        const db = await openDB();
        const transaction = db.transaction(['reels'], 'readwrite');
        const store = transaction.objectStore('reels');
        await store.delete(reelId);
        
        console.log('Reel deleted:', reelId);
        
        // Reload reels
        await loadReels();
    } catch (error) {
        console.error('Error deleting reel:', error);
        alert('Error deleting reel');
    }
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

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    loadReels();
});
