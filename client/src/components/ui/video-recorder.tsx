import { useState, useRef, useEffect } from "react";
import { Camera, RotateCcw, Images, Circle, Square, Zap, Sparkles, Music, Type, Scroll, X, FlipHorizontal, Download, Upload, Smile, Pencil, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./button";
import EnhancedTeleprompter from "@/components/ui/enhanced-teleprompter";
import StickerPickerModal, { type Sticker } from "@/components/ui/sticker-picker-modal";
import DrawingToolModal from "@/components/ui/drawing-tool-modal";
import { useMediaRecorder } from "@/hooks/use-media-recorder";
import { useCanvasRecorder } from "@/hooks/use-canvas-recorder";
import { useCamera } from "@/hooks/use-camera";
import { usePinchZoom } from "@/hooks/use-pinch-zoom";
import { browserStorage } from "@/lib/browser-storage";
import VideoUploadModal from "@/components/ui/video-upload-modal";
import VideoTimelineEditor from "@/components/ui/video-timeline-editor";
import type { TextOverlay } from "./professional-text-overlay-modal";
import type { VideoFilter } from "./instagram-filters-modal";
import type { MusicTrack } from "./music-modal";

interface VideoRecorderProps {
  onOpenFilters: () => void;
  onOpenMusic: () => void;
  onOpenText: () => void;
  currentScript: string;
  textOverlays: TextOverlay[];
  onUpdateOverlays: (overlays: TextOverlay[]) => void;
  recordingStartTime: number;
  currentFilter?: VideoFilter;
  currentMusic?: MusicTrack;
}

type AspectRatio = '9:16' | '1:1' | '16:9';

export default function VideoRecorder({ 
  onOpenFilters, 
  onOpenMusic, 
  onOpenText,
  currentScript,
  textOverlays,
  onUpdateOverlays,
  recordingStartTime,
  currentFilter,
  currentMusic
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<15 | 30 | 60>(15);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(150);
  const [teleprompterFontSize, setTeleprompterFontSize] = useState(24);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [mirrorEnabled, setMirrorEnabled] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showTimelineEditor, setShowTimelineEditor] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showDrawingTool, setShowDrawingTool] = useState(false);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [drawingLayers, setDrawingLayers] = useState<Array<{ id: string; imageData: string; opacity?: number }>>([]);
  const backgroundAudioRef = useRef<HTMLAudioElement>(null);
  
  // Pinch-to-zoom functionality
  const { scale, resetZoom, isZoomed } = usePinchZoom(videoContainerRef, {
    minZoom: 1,
    maxZoom: 3,
    zoomSpeed: 0.01
  });

  const { toast } = useToast();

  const { stream, startCamera, switchCamera, stopCamera, facingMode } = useCamera();
  const { 
    isRecording: isBasicRecording, 
    recordingTime: basicRecordingTime, 
    startRecording: startBasicRecording, 
    stopRecording: stopBasicRecording, 
    recordedBlob: basicRecordedBlob 
  } = useMediaRecorder(stream);
  
  const {
    isRecording: isCanvasRecording,
    recordingTime: canvasRecordingTime,
    startRecording: startCanvasRecording,
    stopRecording: stopCanvasRecording,
    recordedBlob: canvasRecordedBlob,
    canvasRef
  } = useCanvasRecorder();
  
  // Use canvas recording when mirror, filters, overlays, stickers, or drawings are enabled
  const useCanvasMode = mirrorEnabled || currentFilter?.cssFilter || textOverlays.length > 0 || stickers.length > 0 || drawingLayers.length > 0;
  const isRecording = useCanvasMode ? isCanvasRecording : isBasicRecording;
  const recordingTime = useCanvasMode ? canvasRecordingTime : basicRecordingTime;
  const recordedBlob = useCanvasMode ? canvasRecordedBlob : basicRecordedBlob;

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
      if (useCanvasMode) {
        stopCanvasRecording();
      } else {
        stopBasicRecording();
      }
      // Pause background music when stopping recording
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
    } else {
      if (useCanvasMode && videoRef.current) {
        startCanvasRecording(videoRef.current, {
          mirrorEnabled,
          filter: currentFilter?.cssFilter,
          aspectRatio,
          textOverlays: textOverlays,
          stickers: stickers,
          drawingLayers: drawingLayers
        });
      } else {
        startBasicRecording();
      }
      // Start background music when starting recording
      if (currentMusic && backgroundAudioRef.current) {
        backgroundAudioRef.current.src = currentMusic.url;
        backgroundAudioRef.current.volume = 0.3; // Lower volume for background
        backgroundAudioRef.current.play().catch(console.error);
      }
    }
  };

  // Show save modal when recording stops
  useEffect(() => {
    const currentBlob = useCanvasMode ? canvasRecordedBlob : basicRecordedBlob;
    if (currentBlob && !isRecording) {
      setShowSaveModal(true);
    }
  }, [canvasRecordedBlob, basicRecordedBlob, isRecording, useCanvasMode]);

  const [isSaving, setIsSaving] = useState(false);
  
  const saveReel = async (data: { 
    title: string;
    description?: string;
    duration: number;
    script?: string;
  }) => {
    const currentBlob = useCanvasMode ? canvasRecordedBlob : basicRecordedBlob;
    if (!currentBlob) {
      toast({
        title: "Save Failed",
        description: "No video recorded. Please record a video first.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await browserStorage.saveReel({
        ...data,
        script: data.script || null,
        description: data.description || null,
        videoBlob: currentBlob,
        thumbnailUrl: null,
        authorId: null,
        sourceArticleId: null,
        metadata: { aspectRatio, filter: currentFilter?.name },
        views: 0,
        likes: 0
      });
      
      setShowSaveModal(false);
      toast({
        title: "Reel Saved!",
        description: "Your reel has been successfully saved to your browser.",
      });
    } catch (error) {
      console.error('Error saving reel:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save your reel. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReel = (title: string, description?: string) => {
    const currentTime = useCanvasMode ? canvasRecordingTime : basicRecordingTime;
    
    console.log(`Saving reel with duration: ${currentTime} seconds`);
    console.log('Recording details:', {
      useCanvasMode,
      canvasRecordingTime,
      basicRecordingTime,
      isRecording
    });
    
    saveReel({
      title: title || "Untitled Reel",
      description,
      duration: Math.max(currentTime || 1, 1), // Ensure at least 1 second but use actual recording time
      script: currentScript,
    });
  };

  const downloadVideo = () => {
    const currentBlob = useCanvasMode ? canvasRecordedBlob : basicRecordedBlob;
    if (currentBlob) {
      const url = URL.createObjectURL(currentBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reel-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "✅ Download Started",
        description: "Video downloaded as WebM. Use online converters for MP4 if needed.",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentRecordingTime = () => {
    return isRecording ? recordingTime : 0;
  };

  const getVisibleOverlays = () => {
    const currentTime = getCurrentRecordingTime();
    return textOverlays.filter(overlay => {
      const overlayEndTime = overlay.startTime + overlay.duration;
      return currentTime >= overlay.startTime && currentTime <= overlayEndTime;
    });
  };

  const removeOverlay = (overlayId: string) => {
    const updatedOverlays = textOverlays.filter(overlay => overlay.id !== overlayId);
    onUpdateOverlays(updatedOverlays);
  };

  const getAspectRatioStyle = () => {
    const ratios = {
      '9:16': { aspectRatio: '9/16', width: '100%', maxWidth: '400px', maxHeight: 'calc(100vh - 200px)' },
      '1:1': { aspectRatio: '1/1', width: '100%', maxWidth: '500px', maxHeight: '500px' },
      '16:9': { aspectRatio: '16/9', width: '100%', maxWidth: '800px', maxHeight: '450px' }
    };
    return ratios[aspectRatio];
  };

  const getAspectRatioLabel = (ratio: AspectRatio) => {
    const labels = {
      '9:16': 'Vertical (Reels/TikTok)',
      '1:1': 'Square (Instagram)',
      '16:9': 'Horizontal (YouTube)'
    };
    return labels[ratio];
  };

  return (
    <div className="relative bg-black rounded-xl overflow-hidden video-aspect-ratio w-full mx-auto transition-all duration-300" style={getAspectRatioStyle()} data-testid="video-recorder">
      {/* Hidden Canvas for Recording */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Video Preview Area */}
      <div 
        ref={videoContainerRef}
        className="w-full h-full relative"
      >
        {/* Scaled Wrapper - Contains video and overlays that should zoom together */}
        <div 
          className="w-full h-full absolute inset-0"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease'
          }}
        >
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-contain ${mirrorEnabled ? 'scale-x-[-1]' : ''}`}
              style={{ 
                filter: currentFilter?.cssFilter || 'none'
              }}
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
          <div className="flex space-x-2">
            {/* Aspect Ratio Selector */}
            <div className="bg-black bg-opacity-50 rounded-lg p-1">
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                className="bg-transparent text-white text-xs md:text-sm border-none outline-none cursor-pointer"
                data-testid="aspect-ratio-selector"
              >
                <option value="9:16" className="bg-gray-800">📱 9:16</option>
                <option value="1:1" className="bg-gray-800">⬜ 1:1</option>
                <option value="16:9" className="bg-gray-800">📺 16:9</option>
              </select>
            </div>
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
        <EnhancedTeleprompter 
          isVisible={showTeleprompter}
          script={currentScript}
          onClose={() => setShowTeleprompter(false)}
          isRecording={isRecording}
          recordingTime={recordingTime}
          speed={teleprompterSpeed}
          fontSize={teleprompterFontSize}
          onSpeedChange={setTeleprompterSpeed}
          onFontSizeChange={setTeleprompterFontSize}
        />
        
        {/* Text Overlays */}
        <div className="absolute inset-0 pointer-events-none" data-testid="text-overlays-container">
          {getVisibleOverlays().map((overlay) => (
            <div
              key={overlay.id}
              className="absolute pointer-events-auto group"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
              data-testid={`text-overlay-${overlay.id}`}
            >
              <div
                style={{
                  fontSize: `${overlay.fontSize}px`,
                  fontFamily: overlay.fontFamily,
                  color: overlay.color,
                  backgroundColor: overlay.backgroundColor,
                  textAlign: overlay.alignment,
                  opacity: overlay.opacity,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  userSelect: 'none',
                  maxWidth: '300px',
                  wordWrap: 'break-word',
                  whiteSpace: 'normal'
                }}
              >
                {overlay.text}
              </div>
              
              {/* Remove button (visible on hover) */}
              <button
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeOverlay(overlay.id)}
                data-testid={`remove-overlay-${overlay.id}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Stickers Overlay */}
        <div className="absolute inset-0 pointer-events-none" data-testid="stickers-container">
          {stickers.map((sticker) => (
            <div
              key={sticker.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                fontSize: `${sticker.size}px`,
                zIndex: 15
              }}
              data-testid={`sticker-${sticker.id}`}
            >
              {sticker.emoji}
            </div>
          ))}
        </div>

        {/* Zoom Indicator */}
        {isZoomed && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2" data-testid="zoom-indicator">
            <ZoomIn className="w-4 h-4" />
            {scale.toFixed(1)}x
          </div>
        )}

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
            className="bg-black bg-opacity-50 text-white rounded-full hover:bg-thoxt-yellow hover:text-black transition-colors"
            onClick={() => setShowStickerPicker(true)}
            data-testid="button-stickers"
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="bg-black bg-opacity-50 text-white rounded-full hover:bg-thoxt-yellow hover:text-black transition-colors"
            onClick={() => setShowDrawingTool(true)}
            data-testid="button-drawing"
          >
            <Pencil className="w-5 h-5" />
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
          
          {isZoomed && (
            <Button
              variant="ghost"
              size="icon"
              className="bg-black bg-opacity-50 text-white rounded-full hover:bg-red-500 hover:text-white transition-colors"
              onClick={resetZoom}
              data-testid="button-reset-zoom"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center items-center space-x-4 md:space-x-8" data-testid="bottom-controls">
          {/* Gallery/Upload */}
          <Button
            variant="ghost"
            size="icon"
            className="bg-gray-600 rounded-full w-12 h-12"
            onClick={() => setShowUploadModal(true)}
            data-testid="button-upload"
          >
            <Upload className="text-white w-6 h-6" />
          </Button>

          {/* Record Button */}
          <div className="relative" data-testid="record-button-container">
            <Button
              variant="ghost"
              size="icon"
              className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center p-0"
              onClick={handleRecordToggle}
              data-testid="button-record"
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 bg-red-500 rounded-full flex items-center justify-center ${
                isRecording ? 'recording-pulse' : ''
              }`}>
                {isRecording ? (
                  <Square className="text-white w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                ) : (
                  <Circle className="text-white w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
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
        
        {/* Upload Modal */}
        <VideoUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onVideoUploaded={(blob) => {
            toast({
              title: "Video Uploaded!",
              description: "Your video has been successfully uploaded and saved.",
            });
            setShowUploadModal(false);
          }}
        />
        
        <VideoTimelineEditor
          isOpen={showTimelineEditor}
          onClose={() => setShowTimelineEditor(false)}
          initialVideo={recordedBlob || undefined}
          onExport={(editedBlob) => {
            toast({
              title: "Export Complete!",
              description: "Your edited video is ready for download.",
            });
            setShowTimelineEditor(false);
          }}
        />
        
        {/* Sticker Picker Modal */}
        <StickerPickerModal
          isOpen={showStickerPicker}
          onClose={() => setShowStickerPicker(false)}
          onAddSticker={(sticker) => {
            setStickers(prev => [...prev, sticker]);
            toast({
              title: "Sticker Added!",
              description: "Your sticker has been added to the video.",
            });
          }}
          currentTime={recordingTime}
        />
        
        {/* Drawing Tool Modal */}
        <DrawingToolModal
          isOpen={showDrawingTool}
          onClose={() => setShowDrawingTool(false)}
          videoElement={videoRef.current || undefined}
          onSaveDrawing={(drawingDataUrl) => {
            setDrawingLayers(prev => [...prev, {
              id: `drawing-${Date.now()}`,
              imageData: drawingDataUrl,
              opacity: 1
            }]);
            toast({
              title: "Drawing Saved!",
              description: "Your drawing has been added to the video.",
            });
          }}
        />
        
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
                    disabled={isSaving}
                    data-testid="button-save-reel"
                  >
                    {isSaving ? 'Saving...' : 'Save Reel'}
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
                    className="bg-blue-600 text-white border-blue-600 hover:bg-blue-500"
                    onClick={() => {
                      setShowSaveModal(false);
                      setShowTimelineEditor(true);
                    }}
                    data-testid="button-edit-reel"
                  >
                    Edit
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
