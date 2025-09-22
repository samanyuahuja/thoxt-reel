// Sample reels data for testing saved reels functionality
import { browserStorage } from './browser-storage';

// Create actual playable sample video blobs using canvas
const createSampleVideoBlob = async (
  duration: number, 
  color: string = '#3b82f6', 
  text: string = 'Sample Video'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 360;

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Create MediaRecorder to record canvas
    const stream = canvas.captureStream(30); // 30 FPS
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8'
    });
    
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      resolve(videoBlob);
    };
    
    mediaRecorder.onerror = reject;
    
    // Start recording
    mediaRecorder.start();
    
    // Animate the canvas
    let frame = 0;
    const totalFrames = duration * 30; // 30 FPS
    
    const animate = () => {
      if (frame >= totalFrames) {
        mediaRecorder.stop();
        return;
      }
      
      // Clear canvas with animated background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, adjustBrightness(color, -20));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add animated elements
      const progress = frame / totalFrames;
      const waveOffset = Math.sin(progress * Math.PI * 4) * 50;
      
      // Draw animated wave
      ctx.fillStyle = adjustBrightness(color, 40);
      ctx.fillRect(50 + waveOffset, 150, canvas.width - 100, 60);
      
      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      
      // Draw progress indicator
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText(`${Math.floor(progress * 100)}%`, canvas.width / 2, canvas.height / 2 + 50);
      
      frame++;
      requestAnimationFrame(animate);
    };
    
    animate();
  });
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
      console.log('Sample reels already exist');
      return;
    }
    
    console.log('Creating sample reels with video content...');
    
    // Create sample reels with actual video blobs
    for (const reelData of sampleReelsData) {
      console.log(`Creating video for: ${reelData.title}`);
      try {
        const videoBlob = await createSampleVideoBlob(
          Math.min(reelData.duration, 10), // Cap at 10 seconds for demo
          reelData.color,
          reelData.title
        );
        
        const { color, ...reelDataForSave } = reelData;
        await browserStorage.saveReel({
          ...reelDataForSave,
          videoBlob
        });
        
        console.log(`✓ Created: ${reelData.title}`);
      } catch (videoError) {
        console.error(`Failed to create video for ${reelData.title}:`, videoError);
        // Continue with other reels even if one fails
      }
    }
    
    console.log('Sample reels creation completed!');
  } catch (error) {
    console.error('Error creating sample reels:', error);
  }
};