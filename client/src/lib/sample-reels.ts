// Sample reels data for testing saved reels functionality
import { browserStorage } from './browser-storage';

// Create a simple MP4 video blob with actual video content
const createSampleVideoBlob = async (
  duration: number,
  color: string = '#3b82f6', 
  text: string = 'Sample Video'
): Promise<Blob> => {
  console.log(`Creating video: ${text} (${duration}s, ${color})`);
  
  try {
    // Try MediaRecorder first with better error handling
    return await createVideoWithMediaRecorder(duration, color, text);
  } catch (error) {
    console.warn('MediaRecorder failed, using fallback method:', error);
    // Fallback to creating a minimal but playable video
    return createFallbackVideoBlob(duration, color, text);
  }
};

// Create video using MediaRecorder API
const createVideoWithMediaRecorder = async (
  duration: number,
  color: string,
  text: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 320;  // Smaller size for better compatibility
    canvas.height = 180;

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Check if MediaRecorder is supported
    if (typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
      reject(new Error('MediaRecorder or captureStream not supported'));
      return;
    }

    const stream = canvas.captureStream(25); // 25 FPS for better compatibility
    
    // Try different codec options for better browser support
    let options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp8' };
    if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
      if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/webm' };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      } else {
        options = { mimeType: 'video/webm' };  // Use default webm
      }
    }

    const mediaRecorder = new MediaRecorder(stream, options);
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      console.log('Data available:', event.data.size, 'bytes');
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      console.log('Recording stopped, chunks:', chunks.length);
      const videoBlob = new Blob(chunks, { type: options.mimeType || 'video/webm' });
      console.log('Video blob created:', videoBlob.size, 'bytes');
      resolve(videoBlob);
    };
    
    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      reject(new Error('MediaRecorder failed'));
    };
    
    // Start recording
    mediaRecorder.start(100); // Collect data every 100ms
    console.log('Recording started...');
    
    // Create animated content with more visible changes
    let frame = 0;
    const fps = 25;
    const totalFrames = Math.max(duration * fps, 75); // Minimum 3 seconds of content
    const frameInterval = 1000 / fps; // ms per frame
    
    console.log(`Creating ${totalFrames} frames at ${fps} FPS for ${duration}s video`);
    
    const animate = () => {
      const progress = frame / totalFrames;
      const time = frame * frameInterval / 1000; // seconds
      
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, adjustBrightness(color, -30));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Multiple animated elements for more visible changes
      
      // Main animated circle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2 + Math.cos(time * 3) * 60, 
        canvas.height / 2 + Math.sin(time * 2) * 40, 
        15 + Math.sin(time * 4) * 5, 0, 2 * Math.PI
      );
      ctx.fill();
      
      // Secondary rotating circles
      for (let i = 0; i < 3; i++) {
        const angle = (time * 2) + (i * Math.PI * 2 / 3);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time + i) * 0.2})`;
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2 + Math.cos(angle) * 30,
          canvas.height / 2 + Math.sin(angle) * 30,
          8, 0, 2 * Math.PI
        );
        ctx.fill();
      }
      
      // Animated progress bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      const barWidth = canvas.width * 0.6;
      const barHeight = 4;
      ctx.fillRect(
        (canvas.width - barWidth) / 2, 
        canvas.height - 40, 
        barWidth * progress, 
        barHeight
      );
      
      // Text with subtle animation
      ctx.fillStyle = `rgba(255, 255, 255, ${0.9 + Math.sin(time * 2) * 0.1})`;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text, canvas.width / 2, 40);
      
      // Frame counter for debugging
      ctx.font = '12px Arial';
      ctx.fillText(`Frame: ${frame}/${totalFrames}`, canvas.width / 2, canvas.height - 20);
      ctx.fillText(`${Math.floor(progress * 100)}%`, canvas.width / 2, canvas.height - 60);
      
      frame++;
      
      if (frame < totalFrames) {
        requestAnimationFrame(animate); // Use requestAnimationFrame instead of setTimeout
      } else {
        console.log(`Animation complete after ${frame} frames, stopping recording...`);
        mediaRecorder.stop();
        // Stop all tracks to free resources
        stream.getTracks().forEach(track => track.stop());
      }
    };
    
    animate();
  });
};

// Fallback method: create a basic video data structure
const createFallbackVideoBlob = (duration: number, color: string, text: string): Blob => {
  console.log('Using fallback video creation');
  
  // Create a simple WebM video with minimal data
  // This is a very basic WebM structure with a single frame
  const webmHeader = new Uint8Array([
    0x1A, 0x45, 0xDF, 0xA3, 0x9F, 0x42, 0x86, 0x81, 0x01, 0x42, 0xF7, 0x81,
    0x01, 0x42, 0xF2, 0x81, 0x04, 0x42, 0xF3, 0x81, 0x08, 0x42, 0x82, 0x84,
    0x77, 0x65, 0x62, 0x6D, 0x42, 0x87, 0x81, 0x04, 0x42, 0x85, 0x81, 0x02
  ]);
  
  return new Blob([webmHeader], { type: 'video/webm' });
};

// Helper function to adjust color brightness
const adjustBrightness = (hexColor: string, percent: number): string => {
  const hex = hexColor.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + percent));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + percent));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + percent));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Sample reels configuration
const sampleReelsData = [
  {
    title: "Fashion Trends 2024",
    description: "The latest fashion trends that are taking over social media",
    duration: 30,
    script: "Hey fashion lovers! 🔥 Let's dive into the hottest trends of 2024. First up, we have oversized blazers that are perfect for any season. Next, sustainable fashion is making a huge comeback. Don't forget to subscribe for more style tips!",
    color: '#ec4899',
    videoUrl: "",
    authorId: "demo-user",
    sourceArticleId: null,
    metadata: {},
    thumbnailUrl: null,
    views: 0,
    likes: 0
  },
  {
    title: "Quick Cooking Tips",
    description: "5-minute meals that will change your life",
    duration: 45,
    script: "Welcome back to my kitchen! Today I'm sharing my top 5-minute meal hacks. First, always prep your ingredients beforehand. Second, invest in quality cookware. These simple tricks will save you hours every week. What's your favorite quick recipe?",
    color: '#f59e0b',
    videoUrl: "",
    authorId: "demo-user",
    sourceArticleId: null,
    metadata: {},
    thumbnailUrl: null,
    views: 0,
    likes: 0
  },
  {
    title: "Morning Motivation",
    description: "Start your day with positive energy",
    duration: 15,
    script: "Good morning everyone! ☀️ Remember, every day is a new opportunity to be amazing. Start with gratitude, set your intentions, and let's make today incredible. You've got this! Drop a ⚡ in the comments if you're ready to conquer your goals!",
    color: '#10b981',
    videoUrl: "",
    authorId: "demo-user",
    sourceArticleId: null,
    metadata: {},
    thumbnailUrl: null,
    views: 0,
    likes: 0
  },
  {
    title: "Tech Review: AI Tools",
    description: "Reviewing the latest AI productivity tools",
    duration: 60,
    script: "What's up tech enthusiasts! Today we're diving deep into AI productivity tools that are actually worth your time. I've tested over 20 apps this month, and these are the game-changers. Let's start with the first one that completely transformed my workflow...",
    color: '#3b82f6',
    videoUrl: "",
    authorId: "demo-user",
    sourceArticleId: null,
    metadata: {},
    thumbnailUrl: null,
    views: 0,
    likes: 0
  }
];

export const createSampleReels = async () => {
  try {
    await browserStorage.init();
    
    // Check if we already have sample reels
    const existingReels = await browserStorage.getAllReels();
    if (existingReels.length > 0) {
      console.log('Sample reels already exist:', existingReels.length);
      return;
    }
    
    console.log('Creating sample reels with video content...');
    
    // Create sample reels with actual video blobs
    for (let i = 0; i < sampleReelsData.length; i++) {
      const reelData = sampleReelsData[i];
      console.log(`[${i + 1}/${sampleReelsData.length}] Creating video for: ${reelData.title}`);
      
      try {
        const startTime = Date.now();
        const videoBlob = await createSampleVideoBlob(
          Math.min(reelData.duration, 8), // Increase to 8 seconds for better content
          reelData.color,
          reelData.title.split(' ').slice(0, 2).join(' ') // Shorter text
        );
        
        const generationTime = Date.now() - startTime;
        console.log(`Video generation took: ${generationTime}ms, size: ${videoBlob.size} bytes`);
        
        if (videoBlob.size < 100) {
          console.warn(`Warning: Video blob seems too small (${videoBlob.size} bytes) for ${reelData.title}`);
        }
        
        const { color, ...reelDataForSave } = reelData;
        await browserStorage.saveReel({
          ...reelDataForSave,
          duration: Math.min(reelData.duration, 5), // Update duration to match video
          videoBlob
        });
        
        console.log(`✓ Created and saved: ${reelData.title}`);
      } catch (videoError) {
        console.error(`Failed to create video for ${reelData.title}:`, videoError);
        
        // Create a reel without video as fallback
        try {
          const { color, ...reelDataForSave } = reelData;
          await browserStorage.saveReel({
            ...reelDataForSave,
            videoBlob: new Blob([''], { type: 'video/webm' })
          });
          console.log(`✓ Created placeholder for: ${reelData.title}`);
        } catch (saveError) {
          console.error(`Failed to save placeholder for ${reelData.title}:`, saveError);
        }
      }
    }
    
    console.log('Sample reels creation completed!');
    
    // Verify what was created
    const finalReels = await browserStorage.getAllReels();
    console.log(`Final count: ${finalReels.length} reels created`);
    finalReels.forEach(reel => {
      console.log(`- ${reel.title}: ${reel.duration}s`);
    });
    
  } catch (error) {
    console.error('Error creating sample reels:', error);
  }
};