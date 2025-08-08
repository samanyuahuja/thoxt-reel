// Browser-based storage system for video reels using IndexedDB
import type { Reel } from "@shared/schema";

const DB_NAME = "ThoxtReelsDB";
const DB_VERSION = 1;
const STORE_NAME = "reels";
const VIDEO_STORE_NAME = "videoBlobs";

interface StoredReel extends Omit<Reel, 'videoUrl'> {
  videoData?: string; // Base64 encoded video data
  thumbnailData?: string; // Base64 encoded thumbnail
  views: number;
  likes: number;
}

class BrowserStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create reels store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const reelsStore = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          reelsStore.createIndex("createdAt", "createdAt", { unique: false });
        }
        
        // Create video blobs store
        if (!db.objectStoreNames.contains(VIDEO_STORE_NAME)) {
          db.createObjectStore(VIDEO_STORE_NAME, { keyPath: "id" });
        }
      };
    });
  }

  async saveReel(reel: Omit<StoredReel, 'id' | 'createdAt'> & { videoBlob?: Blob }): Promise<StoredReel> {
    if (!this.db) await this.init();
    
    const id = `reel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date();
    
    let videoData = '';
    let thumbnailData = '';
    
    // Convert video blob to base64 for storage
    if (reel.videoBlob) {
      videoData = await this.blobToBase64(reel.videoBlob);
      // Generate thumbnail from video
      thumbnailData = await this.generateThumbnail(reel.videoBlob);
    }
    
    const storedReel: StoredReel = {
      ...reel,
      id,
      createdAt,
      videoData,
      thumbnailData,
      views: 0,
      likes: 0
    };
    
    // Remove videoBlob from the stored object
    delete (storedReel as any).videoBlob;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(storedReel);
      
      request.onsuccess = () => resolve(storedReel);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllReels(): Promise<StoredReel[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const reels = request.result as StoredReel[];
        // Sort by creation date, newest first
        reels.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        resolve(reels);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getReel(id: string): Promise<StoredReel | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteReel(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateReelViews(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    const reel = await this.getReel(id);
    if (reel) {
      reel.views = (reel.views || 0) + 1;
      
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(reel);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  // Convert video data back to blob URL for playback
  getVideoUrl(reel: StoredReel): string | null {
    if (!reel.videoData) return null;
    
    try {
      const byteString = atob(reel.videoData.split(',')[1]);
      const mimeString = reel.videoData.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeString });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error converting video data to URL:', error);
      return null;
    }
  }

  // Convert Blob to base64
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Generate thumbnail from video blob
  private async generateThumbnail(videoBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(''); // Return empty string if canvas not available
        return;
      }

      video.onloadedmetadata = () => {
        // Set canvas size to video size with max width of 320px
        const maxWidth = 320;
        const aspectRatio = video.videoHeight / video.videoWidth;
        canvas.width = Math.min(video.videoWidth, maxWidth);
        canvas.height = canvas.width * aspectRatio;
        
        video.currentTime = Math.min(1, video.duration / 2); // Capture frame at middle or 1s
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailDataUrl);
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        resolve(''); // Return empty string on error
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(videoBlob);
      video.load();
    });
  }
}

export const browserStorage = new BrowserStorage();
export type { StoredReel };