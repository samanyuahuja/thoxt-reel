import { useState, useRef, useCallback } from "react";

interface CanvasRecorderOptions {
  mirrorEnabled?: boolean;
  filter?: string;
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

    canvas.width = videoElement.videoWidth || 720;
    canvas.height = videoElement.videoHeight || 1280;
    
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