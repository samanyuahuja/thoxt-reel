import { useState, useRef, useCallback } from "react";

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async (preferredFacingMode?: 'user' | 'environment') => {
    try {
      setError(null);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: preferredFacingMode || facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1920 }, // 9:16 portrait aspect ratio
          aspectRatio: { ideal: 9/16 }
        },
        audio: true
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = newStream;
      setStream(newStream);
      
      if (preferredFacingMode) {
        setFacingMode(preferredFacingMode);
      }
      
    } catch (err) {
      console.error("Failed to access camera:", err);
      setError(err instanceof Error ? err.message : "Failed to access camera");
      
      // Fallback: try without facingMode constraint
      try {
        const fallbackConstraints: MediaStreamConstraints = {
          video: {
            width: { ideal: 1080 },
            height: { ideal: 1920 },
            aspectRatio: { ideal: 9/16 }
          },
          audio: true
        };
        
        const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        streamRef.current = fallbackStream;
        setStream(fallbackStream);
        setError(null);
        
      } catch (fallbackErr) {
        console.error("Fallback camera access failed:", fallbackErr);
        
        // Development mode: Create a test video stream when camera is unavailable
        try {
          console.log("Creating test video stream for development...");
          const canvas = document.createElement('canvas');
          canvas.width = 1080;
          canvas.height = 1920;
          const ctx = canvas.getContext('2d')!;
          
          // Create a simple animated test pattern
          let frame = 0;
          const drawFrame = () => {
            // Clear canvas
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw animated test pattern
            ctx.fillStyle = '#FFD700'; // thoxt yellow
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('TEST VIDEO', canvas.width/2, canvas.height/2 - 50);
            ctx.fillText(`Recording...`, canvas.width/2, canvas.height/2 + 50);
            
            // Animated element
            const time = Date.now() / 1000;
            ctx.fillStyle = `hsl(${(time * 60) % 360}, 70%, 60%)`;
            ctx.beginPath();
            ctx.arc(canvas.width/2, canvas.height/2 + 150, 30 + Math.sin(time * 3) * 10, 0, 2 * Math.PI);
            ctx.fill();
            
            frame++;
          };
          
          // Draw initial frame
          drawFrame();
          
          // Create stream from canvas
          const testStream = canvas.captureStream(30); // 30 FPS
          
          // Add a simple audio track (silent)
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Silent
          oscillator.connect(gainNode);
          
          const dest = audioCtx.createMediaStreamDestination();
          gainNode.connect(dest);
          oscillator.start();
          
          // Add silent audio track to test stream
          const audioTrack = dest.stream.getAudioTracks()[0];
          if (audioTrack) {
            testStream.addTrack(audioTrack);
          }
          
          // Animate the test pattern
          const animate = () => {
            drawFrame();
            requestAnimationFrame(animate);
          };
          animate();
          
          streamRef.current = testStream;
          setStream(testStream);
          setError("Using test video stream (camera not available)");
          console.log("Test video stream created successfully!");
          
        } catch (testErr) {
          console.error("Failed to create test video stream:", testErr);
          setError("Camera access denied or not available");
        }
      }
    }
  }, [facingMode]);

  const switchCamera = useCallback(() => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(newFacingMode);
  }, [facingMode, startCamera]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  return {
    stream,
    facingMode,
    error,
    startCamera,
    switchCamera,
    stopCamera
  };
}
