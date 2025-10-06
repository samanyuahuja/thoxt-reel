import { useState, useRef, useCallback } from "react";

export function useMediaRecorder(stream: MediaStream | null) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(() => {
    if (!stream) {
      console.error("No media stream available");
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.addEventListener('dataavailable', (event) => {
        console.log(`MediaRecorder data available: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm;codecs=vp8,opus' });
        console.log(`MediaRecorder stopped. Final blob size: ${blob.size} bytes`);
        setRecordedBlob(blob);
        chunksRef.current = [];
      });

      mediaRecorder.start(1000); // Record in 1-second chunks to ensure data is captured
      setIsRecording(true);
      setRecordingTime(0);

      console.log("Recording started");

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          console.log(`Recording time: ${newTime} seconds`);
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Keep the recording time for saving - DON'T reset it here!
    console.log(`Recording stopped. Total duration: ${recordingTime} seconds`);
  }, [recordingTime]);

  return {
    isRecording,
    recordingTime,
    recordedBlob,
    startRecording,
    stopRecording
  };
}
