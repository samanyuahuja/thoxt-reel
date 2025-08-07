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
          width: { ideal: 720 },
          height: { ideal: 1280 }, // 9:16 aspect ratio
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
            width: { ideal: 720 },
            height: { ideal: 1280 }
          },
          audio: true
        };
        
        const fallbackStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        streamRef.current = fallbackStream;
        setStream(fallbackStream);
        setError(null);
        
      } catch (fallbackErr) {
        console.error("Fallback camera access failed:", fallbackErr);
        setError("Camera access denied or not available");
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
