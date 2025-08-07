import { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, Images, Circle, Square, Zap, Sparkles, Music, Type, Scroll, X } from "lucide-react";
import { Button } from "./button";
import Teleprompter from "@/components/ui/teleprompter";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { useCamera } from "@/hooks/use-camera";

interface VideoRecorderProps {
  onOpenFilters: () => void;
  onOpenMusic: () => void;
  onOpenText: () => void;
  currentScript: string;
}

export default function VideoRecorder({ 
  onOpenFilters, 
  onOpenMusic, 
  onOpenText,
  currentScript 
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState<15 | 30 | 60>(15);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  const { stream, startCamera, switchCamera, stopCamera, facingMode } = useCamera();
  const { 
    isRecording, 
    recordingTime, 
    startRecording, 
    stopRecording, 
    recordedBlob 
  } = useMediaRecorder(stream);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative bg-black rounded-xl overflow-hidden video-aspect-ratio" style={{ width: '380px', height: '675px' }} data-testid="video-recorder">
      {/* Video Preview Area */}
      <div className="w-full h-full relative">
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            data-testid="video-preview"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center" data-testid="video-placeholder">
            <div className="text-gray-400 text-center">
              <Camera className="w-16 h-16 mb-4 opacity-50 mx-auto" />
              <p className="text-lg">Camera Preview</p>
              <p className="text-sm">Starting camera...</p>
            </div>
          </div>
        )}

        {/* Top Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center" data-testid="top-controls">
          <Button
            variant="ghost" 
            size="icon"
            className={`bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 ${flashEnabled ? 'text-thoxt-yellow' : ''}`}
            onClick={() => setFlashEnabled(!flashEnabled)}
            data-testid="button-flash"
          >
            <Zap className="w-5 h-5" />
          </Button>
          
          <div className="flex space-x-2" data-testid="duration-controls">
            {[15, 30, 60].map((dur) => (
              <Button
                key={dur}
                variant="ghost"
                size="sm"
                className={`bg-black bg-opacity-50 text-white rounded-full text-sm font-medium hover:bg-opacity-70 ${
                  duration === dur ? 'bg-thoxt-yellow text-black' : ''
                }`}
                onClick={() => setDuration(dur as 15 | 30 | 60)}
                data-testid={`button-duration-${dur}`}
              >
                {dur}s
              </Button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="icon" 
            className="bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
            data-testid="button-close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Teleprompter Overlay */}
        <Teleprompter 
          isVisible={showTeleprompter}
          script={currentScript}
          onClose={() => setShowTeleprompter(false)}
        />

        {/* Side Effects Panel */}
        <div className="absolute right-4 top-32 bottom-32 flex flex-col justify-center space-y-4" data-testid="effects-panel">
          <Button
            variant="ghost"
            size="icon"
            className="bg-black bg-opacity-50 text-white rounded-full hover:bg-thoxt-yellow hover:text-black transition-colors"
            onClick={onOpenFilters}
            data-testid="button-filters"
          >
            <Sparkles className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="bg-black bg-opacity-50 text-white rounded-full hover:bg-thoxt-yellow hover:text-black transition-colors"
            onClick={onOpenMusic}
            data-testid="button-music"
          >
            <Music className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="bg-black bg-opacity-50 text-white rounded-full hover:bg-thoxt-yellow hover:text-black transition-colors"
            onClick={onOpenText}
            data-testid="button-text"
          >
            <Type className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={`bg-black bg-opacity-50 text-white rounded-full hover:bg-thoxt-yellow hover:text-black transition-colors ${
              showTeleprompter ? 'bg-thoxt-yellow text-black' : ''
            }`}
            onClick={() => setShowTeleprompter(!showTeleprompter)}
            data-testid="button-teleprompter"
          >
            <Scroll className="w-5 h-5" />
          </Button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center space-x-8" data-testid="bottom-controls">
          {/* Gallery/Upload */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-gray-600 rounded-full w-12 h-12"
            data-testid="button-gallery"
          >
            <Images className="text-white w-6 h-6" />
          </Button>

          {/* Record Button */}
          <div className="relative" data-testid="record-button-container">
            <Button
              variant="ghost"
              size="icon"
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center p-0"
              onClick={handleRecordToggle}
              data-testid="button-record"
            >
              <div className={`w-16 h-16 bg-red-500 rounded-full flex items-center justify-center ${
                isRecording ? 'recording-pulse' : ''
              }`}>
                {isRecording ? (
                  <Square className="text-white w-8 h-8" fill="currentColor" />
                ) : (
                  <Circle className="text-white w-8 h-8" fill="currentColor" />
                )}
              </div>
            </Button>
            
            {/* Recording Timer */}
            {isRecording && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-sm" data-testid="recording-timer">
                {formatTime(recordingTime)}
              </div>
            )}
          </div>

          {/* Camera Flip */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-gray-600 rounded-full w-12 h-12"
            onClick={switchCamera}
            data-testid="button-flip-camera"
          >
            <RotateCcw className="text-white w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
