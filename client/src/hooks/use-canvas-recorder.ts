import { useState, useRef, useCallback } from "react";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  opacity: number;
  startTime: number;
  duration: number;
}

interface Sticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  startTime: number;
  duration: number;
}

interface DrawingLayer {
  id: string;
  imageData: string; // data URL
  opacity?: number;
}

interface CanvasRecorderOptions {
  mirrorEnabled?: boolean;
  filter?: string;
  aspectRatio?: '9:16' | '1:1' | '16:9';
  textOverlays?: TextOverlay[];
  stickers?: Sticker[];
  drawingLayers?: DrawingLayer[];
}

export function useCanvasRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number>();
  const timerRef = useRef<NodeJS.Timeout>();
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimeRef = useRef<number>(0);
  const isRecordingRef = useRef<boolean>(false);
  const drawingImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const initializeCanvas = useCallback((videoElement: HTMLVideoElement, options: CanvasRecorderOptions) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    // Pre-load drawing images
    if (options.drawingLayers) {
      options.drawingLayers.forEach(layer => {
        if (!drawingImagesRef.current.has(layer.id)) {
          const img = new Image();
          img.src = layer.imageData;
          drawingImagesRef.current.set(layer.id, img);
        }
      });
    }

    // Calculate canvas dimensions based on aspect ratio
    const getCanvasDimensions = () => {
      const videoWidth = videoElement.videoWidth || 720;
      const videoHeight = videoElement.videoHeight || 1280;
      
      switch (options.aspectRatio) {
        case '1:1':
          // Square format - use the smaller dimension
          const squareSize = Math.min(videoWidth, videoHeight);
          return { width: squareSize, height: squareSize };
        case '16:9':
          // Horizontal format
          if (videoWidth > videoHeight) {
            return { width: videoWidth, height: Math.round(videoWidth * 9 / 16) };
          } else {
            return { width: Math.round(videoHeight * 16 / 9), height: videoHeight };
          }
        case '9:16':
        default:
          // Vertical format (default)
          if (videoHeight > videoWidth) {
            return { width: videoWidth, height: Math.round(videoWidth * 16 / 9) };
          } else {
            return { width: Math.round(videoHeight * 9 / 16), height: videoHeight };
          }
      }
    };
    
    const { width, height } = getCanvasDimensions();
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    contextRef.current = ctx;

    // Apply CSS filter to canvas context if provided
    if (options.filter) {
      ctx.filter = options.filter;
    }

    const drawFrame = () => {
      if (!ctx || !videoElement) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw video
      if (options.mirrorEnabled) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      }

      // Draw text overlays
      if (options.textOverlays && options.textOverlays.length > 0) {
        const currentTime = recordingTimeRef.current;
        options.textOverlays.forEach(overlay => {
          // Default to showing overlay for entire video if timing is not set
          const startTime = overlay.startTime ?? 0;
          const duration = overlay.duration ?? Infinity;
          const overlayEndTime = startTime + duration;
          
          if (currentTime >= startTime && currentTime <= overlayEndTime) {
            ctx.save();
            ctx.globalAlpha = overlay.opacity ?? 1;
            ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
            ctx.fillStyle = overlay.backgroundColor;
            ctx.textAlign = 'center';
            
            const x = (overlay.x / 100) * canvas.width;
            const y = (overlay.y / 100) * canvas.height;
            
            // Draw background
            const textMetrics = ctx.measureText(overlay.text);
            const padding = 12;
            ctx.fillRect(
              x - textMetrics.width / 2 - padding,
              y - overlay.fontSize / 2 - padding,
              textMetrics.width + padding * 2,
              overlay.fontSize + padding * 2
            );
            
            // Draw text
            ctx.fillStyle = overlay.color;
            ctx.fillText(overlay.text, x, y);
            ctx.restore();
          }
        });
      }

      // Draw stickers
      if (options.stickers && options.stickers.length > 0) {
        const currentTime = recordingTimeRef.current;
        options.stickers.forEach(sticker => {
          // Default to showing sticker for entire video if timing is not set
          const startTime = sticker.startTime ?? 0;
          const duration = sticker.duration ?? Infinity;
          const stickerEndTime = startTime + duration;
          
          if (currentTime >= startTime && currentTime <= stickerEndTime) {
            ctx.save();
            const x = (sticker.x / 100) * canvas.width;
            const y = (sticker.y / 100) * canvas.height;
            
            ctx.translate(x, y);
            ctx.rotate(((sticker.rotation ?? 0) * Math.PI) / 180);
            ctx.font = `${sticker.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sticker.emoji, 0, 0);
            ctx.restore();
          }
        });
      }

      // Draw drawing layers
      if (options.drawingLayers && options.drawingLayers.length > 0) {
        options.drawingLayers.forEach(layer => {
          const img = drawingImagesRef.current.get(layer.id);
          if (img && img.complete && img.naturalHeight !== 0) {
            ctx.save();
            ctx.globalAlpha = layer.opacity ?? 1;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            ctx.restore();
          }
        });
      }

      // Continue animation loop while recording
      if (isRecordingRef.current) {
        animationFrameRef.current = requestAnimationFrame(drawFrame);
      }
    };

    return drawFrame;
  }, [isRecording]);

  const startRecording = useCallback(async (videoElement: HTMLVideoElement, options: CanvasRecorderOptions = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawFrame = initializeCanvas(videoElement, options);
    if (!drawFrame) return;

    try {
      // Get canvas stream
      const canvasStream = canvas.captureStream(30); // 30 FPS
      
      // Get audio from the original video stream if available
      const videoStream = videoElement.srcObject as MediaStream;
      const audioTracks = videoStream?.getAudioTracks() || [];
      
      // Combine canvas video with original audio
      const recordingStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks
      ]);
      
      streamRef.current = recordingStream;

      const mediaRecorder = new MediaRecorder(recordingStream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log(`Canvas MediaRecorder data available: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm;codecs=vp9' });
        const finalDuration = recordingTimeRef.current;
        console.log(`Canvas MediaRecorder stopped. Final blob size: ${blob.size} bytes`);
        setRecordedBlob(blob);
        setIsRecording(false);
        // DON'T reset recording time here! Keep it for saving!
        console.log(`Canvas recording completed with duration: ${finalDuration} seconds`);
        
        // Clean up
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = undefined;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Record in 1-second chunks
      
      // Start drawing frames continuously - set ref BEFORE calling drawFrame
      isRecordingRef.current = true;
      setIsRecording(true);
      drawFrame();
      
      // Start timer
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      console.log("Canvas recording started");
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          recordingTimeRef.current = newTime; // Keep ref in sync
          console.log(`Canvas recording time: ${newTime} seconds`);
          return newTime;
        });
      }, 1000);
      
      // Already set above before drawFrame()
      
    } catch (error) {
      console.error('Failed to start canvas recording:', error);
    }
  }, [initializeCanvas]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      const currentDuration = recordingTimeRef.current;
      console.log(`Canvas recording stopped. Total duration: ${currentDuration} seconds`);
      
      // Stop animation loop first
      isRecordingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, []);

  return {
    isRecording,
    recordingTime,
    recordedBlob,
    canvasRef,
    startRecording,
    stopRecording,
    setRecordedBlob
  };
}