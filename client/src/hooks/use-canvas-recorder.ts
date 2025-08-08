import { useState, useRef, useCallback } from "react";

interface CanvasRecorderOptions {
  mirrorEnabled?: boolean;
  filter?: string;
  aspectRatio?: '9:16' | '1:1' | '16:9';
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

  const initializeCanvas = useCallback((videoElement: HTMLVideoElement, options: CanvasRecorderOptions) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

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
      
      if (options.mirrorEnabled) {
        // Apply mirror transformation
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(videoElement, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      }

      if (isRecording) {
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
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
        setIsRecording(false);
        setRecordingTime(0);
        
        // Clean up
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      
      // Start drawing frames
      drawFrame();
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      setIsRecording(true);
      
    } catch (error) {
      console.error('Failed to start canvas recording:', error);
    }
  }, [initializeCanvas]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  }, [isRecording]);

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