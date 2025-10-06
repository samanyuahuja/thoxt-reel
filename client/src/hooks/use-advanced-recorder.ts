import { useState, useRef, useCallback } from 'react';
import RecordRTC, { RecordRTCPromisesHandler } from 'recordrtc';

export interface AdvancedRecorderOptions {
  video?: boolean;
  audio?: boolean;
  screen?: boolean;
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

export function useAdvancedRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  
  const recorderRef = useRef<RecordRTCPromisesHandler | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const recordingTimeRef = useRef(0);

  const startRecording = useCallback(async (
    stream: MediaStream,
    options: AdvancedRecorderOptions = {}
  ) => {
    try {
      const {
        mimeType = 'video/webm;codecs=vp9',
        videoBitsPerSecond = 2500000,
        audioBitsPerSecond = 128000
      } = options;

      streamRef.current = stream;

      // Initialize RecordRTC with advanced options
      const recorder = new RecordRTCPromisesHandler(stream, {
        type: 'video',
        mimeType: mimeType as any,
        disableLogs: false,
        videoBitsPerSecond: videoBitsPerSecond,
        audioBitsPerSecond: audioBitsPerSecond,
        timeSlice: 1000, // Get data every second
        ondataavailable: (blob: Blob) => {
          console.log('Data available:', blob.size, 'bytes');
        },
        // Enhanced recorder configuration
        recorderType: RecordRTC.MediaStreamRecorder,
        numberOfAudioChannels: 2,
        checkForInactiveTracks: true,
        bufferSize: 16384
      });

      await recorder.startRecording();
      recorderRef.current = recorder;
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      recordingTimeRef.current = 0;

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          recordingTimeRef.current = newTime;
          console.log(`Advanced recording time: ${newTime} seconds`);
          return newTime;
        });
      }, 1000);

      console.log('Advanced recording started with RecordRTC');
      
    } catch (error) {
      console.error('Failed to start advanced recording:', error);
      throw error;
    }
  }, []);

  const pauseRecording = useCallback(async () => {
    if (recorderRef.current && isRecording && !isPaused) {
      await recorderRef.current.pauseRecording();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      console.log('Recording paused');
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(async () => {
    if (recorderRef.current && isRecording && isPaused) {
      await recorderRef.current.resumeRecording();
      setIsPaused(false);
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          recordingTimeRef.current = newTime;
          return newTime;
        });
      }, 1000);
      
      console.log('Recording resumed');
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !isRecording) return null;

    try {
      const currentDuration = recordingTimeRef.current;
      console.log(`Stopping advanced recording. Duration: ${currentDuration} seconds`);

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }

      // Stop recording and get blob
      await recorderRef.current.stopRecording();
      const blob = await recorderRef.current.getBlob();
      
      console.log(`Recording stopped. Blob size: ${blob.size} bytes, type: ${blob.type}`);
      
      // Stop and clean up stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Destroy recorder
      await recorderRef.current.destroy();
      recorderRef.current = null;

      setIsRecording(false);
      setIsPaused(false);
      setRecordedBlob(blob);

      return blob;
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
      setIsPaused(false);
      return null;
    }
  }, [isRecording]);

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
  }, []);

  return {
    isRecording,
    isPaused,
    recordingTime,
    recordedBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    setRecordedBlob
  };
}
