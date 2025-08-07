import { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, Images, Circle, Square, Zap, Sparkles, Music, Type, Scroll, X, FlipHorizontal, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  const [mirrorEnabled, setMirrorEnabled] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Show save modal when recording stops
  useEffect(() => {
    if (recordedBlob && !isRecording) {
      setShowSaveModal(true);
    }
  }, [recordedBlob, isRecording]);

  // Save reel mutation
  const saveReelMutation = useMutation({
    mutationFn: async (reelData: {
      title: string;
      description?: string;
      videoUrl: string;
      duration: number;
      script?: string;
    }) => {
      const response = await apiRequest("POST", "/api/reels", reelData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reel Saved!",
        description: "Your reel has been saved successfully.",
      });
      setShowSaveModal(false);
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save your reel. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSaveReel = (title: string, description?: string) => {
    if (recordedBlob) {
      // Create a blob URL for the video (in real app, you'd upload to cloud storage)
      const videoUrl = URL.createObjectURL(recordedBlob);
      
      saveReelMutation.mutate({
        title,
        description,
        videoUrl,
        duration: recordingTime,
        script: currentScript,
      });
    }
  };

  const downloadVideo = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `thoxt-reel-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Your video is being downloaded.",
      });
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
            className={`w-full h-full object-cover ${mirrorEnabled ? 'scale-x-[-1]' : ''}`}
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
          <div className="flex space-x-2">
            <Button
              variant="ghost" 
              size="icon"
              className={`bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 ${flashEnabled ? 'text-thoxt-yellow' : ''}`}
              onClick={() => setFlashEnabled(!flashEnabled)}
              data-testid="button-flash"
            >
              <Zap className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost" 
              size="icon"
              className={`bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 ${mirrorEnabled ? 'text-thoxt-yellow' : ''}`}
              onClick={() => setMirrorEnabled(!mirrorEnabled)}
              data-testid="button-mirror"
            >
              <FlipHorizontal className="w-5 h-5" />
            </Button>
          </div>
          
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
        
        {/* Save Modal */}
        {showSaveModal && recordedBlob && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
            <div className="bg-thoxt-gray p-6 rounded-lg w-80 mx-4">
              <h3 className="text-lg font-semibold mb-4 text-white">Save Your Reel</h3>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter reel title..."
                  className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-thoxt-yellow"
                  id="reel-title"
                  data-testid="input-reel-title"
                />
                
                <textarea
                  placeholder="Add description (optional)..."
                  className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-thoxt-yellow h-20 resize-none"
                  id="reel-description"
                  data-testid="textarea-reel-description"
                />
                
                <div className="flex space-x-2">
                  <Button
                    className="flex-1 bg-thoxt-yellow text-black font-medium hover:bg-yellow-400"
                    onClick={() => {
                      const title = (document.getElementById('reel-title') as HTMLInputElement)?.value || 'Untitled Reel';
                      const description = (document.getElementById('reel-description') as HTMLTextAreaElement)?.value;
                      handleSaveReel(title, description);
                    }}
                    disabled={saveReelMutation.isPending}
                    data-testid="button-save-reel"
                  >
                    {saveReelMutation.isPending ? 'Saving...' : 'Save Reel'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                    onClick={downloadVideo}
                    data-testid="button-download-reel"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                    onClick={() => setShowSaveModal(false)}
                    data-testid="button-cancel-save"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
