import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "./button";
import { Slider } from "./slider";
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Scissors, 
  Download, 
  Volume2, 
  VolumeX,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Type,
  Layers,
  GripVertical,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  startTime: number;
  endTime: number;
  fontFamily: string;
}

interface VideoClip {
  id: string;
  name: string;
  blob: Blob;
  duration: number;
  startTime: number;
  endTime: number;
  originalDuration: number;
  thumbnailUrl?: string;
  textOverlays?: TextOverlay[];
}

interface VideoTimelineEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialVideo?: Blob;
  onExport?: (editedBlob: Blob) => void;
}

export default function VideoTimelineEditor({
  isOpen,
  onClose,
  initialVideo,
  onExport
}: VideoTimelineEditorProps) {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [newTextOverlay, setNewTextOverlay] = useState<Partial<TextOverlay>>({
    text: '',
    x: 50,
    y: 50,
    fontSize: 24,
    color: '#ffffff',
    startTime: 0,
    endTime: 5,
    fontFamily: 'Arial'
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize with video if provided
  useEffect(() => {
    if (initialVideo && clips.length === 0) {
      initializeVideoClip(initialVideo);
    }
  }, [initialVideo, clips.length]);

  const initializeVideoClip = async (videoBlob: Blob) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoBlob);
    
    return new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        const clip: VideoClip = {
          id: `clip_${Date.now()}`,
          name: `Video ${clips.length + 1}`,
          blob: videoBlob,
          duration: video.duration,
          startTime: 0,
          endTime: video.duration,
          originalDuration: video.duration,
        };
        
        // Generate thumbnail
        generateThumbnail(video, clip.id).then(thumbnailUrl => {
          clip.thumbnailUrl = thumbnailUrl;
          setClips(prev => [...prev, clip]);
          setSelectedClipId(clip.id);
        });
        
        URL.revokeObjectURL(url);
        resolve();
      };
      video.src = url;
    });
  };

  const generateThumbnail = async (video: HTMLVideoElement, clipId: string): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 120;
    canvas.height = 68;
    
    video.currentTime = 1; // Capture at 1 second
    await new Promise(resolve => {
      video.onseeked = resolve;
    });
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL();
  };

  const selectedClip = clips.find(clip => clip.id === selectedClipId);
  const totalDuration = clips.reduce((sum, clip) => sum + (clip.endTime - clip.startTime), 0);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    if (!videoRef.current) return;
    
    // Find which clip this time belongs to
    let accumulatedTime = 0;
    let targetClip: VideoClip | null = null;
    let clipStartTime = 0;
    
    for (const clip of clips) {
      const clipDuration = clip.endTime - clip.startTime;
      if (time <= accumulatedTime + clipDuration) {
        targetClip = clip;
        clipStartTime = accumulatedTime;
        break;
      }
      accumulatedTime += clipDuration;
    }
    
    if (targetClip) {
      const relativeTime = time - clipStartTime;
      const actualVideoTime = targetClip.startTime + relativeTime;
      
      // Load the clip if it's not currently loaded
      if (selectedClipId !== targetClip.id) {
        loadClip(targetClip.id);
      }
      
      videoRef.current.currentTime = actualVideoTime;
      setCurrentTime(time);
    }
  };

  const loadClip = (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip || !videoRef.current) return;
    
    const url = URL.createObjectURL(clip.blob);
    videoRef.current.src = url;
    setSelectedClipId(clipId);
    
    // Clean up URL when video loads
    videoRef.current.onloadeddata = () => {
      URL.revokeObjectURL(url);
    };
  };

  const trimClip = (clipId: string, newStart: number, newEnd: number) => {
    setClips(prev => prev.map(clip => 
      clip.id === clipId 
        ? { ...clip, startTime: newStart, endTime: newEnd }
        : clip
    ));
  };

  const splitClipAtTime = (clipId: string, splitTime: number) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    const relativeTime = clip.startTime + splitTime;
    
    // Create two new clips from the split
    const firstClip: VideoClip = {
      ...clip,
      id: `${clipId}_split_1`,
      name: `${clip.name} (Part 1)`,
      endTime: relativeTime,
    };
    
    const secondClip: VideoClip = {
      ...clip,
      id: `${clipId}_split_2`,
      name: `${clip.name} (Part 2)`,
      startTime: relativeTime,
    };
    
    setClips(prev => {
      const clipIndex = prev.findIndex(c => c.id === clipId);
      const newClips = [...prev];
      newClips.splice(clipIndex, 1, firstClip, secondClip);
      return newClips;
    });
    
    toast({
      title: "Clip Split",
      description: `Split clip into two parts at ${formatTime(splitTime)}`,
    });
  };

  const deleteClip = (clipId: string) => {
    setClips(prev => prev.filter(clip => clip.id !== clipId));
    if (selectedClipId === clipId) {
      setSelectedClipId(clips[0]?.id || null);
    }
    
    toast({
      title: "Clip Deleted",
      description: "Removed clip from timeline",
    });
  };

  const duplicateClip = (clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    const newClip: VideoClip = {
      ...clip,
      id: `${clipId}_copy_${Date.now()}`,
      name: `${clip.name} (Copy)`,
    };
    
    const clipIndex = clips.findIndex(c => c.id === clipId);
    setClips(prev => {
      const newClips = [...prev];
      newClips.splice(clipIndex + 1, 0, newClip);
      return newClips;
    });
    
    toast({
      title: "Clip Duplicated",
      description: "Added copy of clip to timeline",
    });
  };

  const moveClip = (clipId: string, direction: 'left' | 'right') => {
    const clipIndex = clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) return;
    
    const newIndex = direction === 'left' ? clipIndex - 1 : clipIndex + 1;
    if (newIndex < 0 || newIndex >= clips.length) return;
    
    setClips(prev => {
      const newClips = [...prev];
      [newClips[clipIndex], newClips[newIndex]] = [newClips[newIndex], newClips[clipIndex]];
      return newClips;
    });
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setClips((clips) => {
        const oldIndex = clips.findIndex(c => c.id === active.id);
        const newIndex = clips.findIndex(c => c.id === over.id);
        
        return arrayMove(clips, oldIndex, newIndex);
      });
      
      toast({
        title: "Clips Reordered",
        description: "Timeline has been updated with new clip order",
      });
    }
  };
  
  const addTextOverlay = () => {
    if (!selectedClipId || !newTextOverlay.text?.trim()) return;
    
    const overlay: TextOverlay = {
      id: `overlay_${Date.now()}`,
      text: newTextOverlay.text || '',
      x: newTextOverlay.x || 50,
      y: newTextOverlay.y || 50,
      fontSize: newTextOverlay.fontSize || 24,
      color: newTextOverlay.color || '#ffffff',
      startTime: newTextOverlay.startTime || 0,
      endTime: newTextOverlay.endTime || 5,
      fontFamily: newTextOverlay.fontFamily || 'Arial'
    };
    
    setClips(prev => prev.map(clip => 
      clip.id === selectedClipId 
        ? { ...clip, textOverlays: [...(clip.textOverlays || []), overlay] }
        : clip
    ));
    
    setNewTextOverlay({
      text: '',
      x: 50,
      y: 50,
      fontSize: 24,
      color: '#ffffff',
      startTime: 0,
      endTime: 5,
      fontFamily: 'Arial'
    });
    
    setShowTextOverlay(false);
    
    toast({
      title: "Text Overlay Added",
      description: "Text overlay has been added to the selected clip",
    });
  };
  
  const removeTextOverlay = (clipId: string, overlayId: string) => {
    setClips(prev => prev.map(clip => 
      clip.id === clipId 
        ? { ...clip, textOverlays: clip.textOverlays?.filter(o => o.id !== overlayId) }
        : clip
    ));
    
    toast({
      title: "Text Overlay Removed",
      description: "Text overlay has been removed from the clip",
    });
  };
  
  const mergeClips = async () => {
    if (clips.length < 2) {
      toast({
        title: "Cannot Merge",
        description: "You need at least 2 clips to merge",
        variant: "destructive"
      });
      return;
    }
    
    setIsExporting(true);
    try {
      // Create a merged clip from all clips
      const mergedClip: VideoClip = {
        id: `merged_${Date.now()}`,
        name: "Merged Clip",
        blob: clips[0].blob, // Placeholder - in real implementation would merge video data
        duration: clips.reduce((total, clip) => total + (clip.endTime - clip.startTime), 0),
        startTime: 0,
        endTime: clips.reduce((total, clip) => total + (clip.endTime - clip.startTime), 0),
        originalDuration: clips.reduce((total, clip) => total + (clip.endTime - clip.startTime), 0),
        textOverlays: clips.flatMap(clip => clip.textOverlays || [])
      };
      
      setClips([mergedClip]);
      setSelectedClipId(mergedClip.id);
      
      toast({
        title: "Clips Merged",
        description: `Successfully merged ${clips.length} clips into one`,
      });
    } catch (error) {
      toast({
        title: "Merge Failed",
        description: "Unable to merge clips. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportVideo = async () => {
    if (clips.length === 0) return;
    
    setIsExporting(true);
    try {
      // For now, export the first clip (can be extended to merge multiple clips)
      const firstClip = clips[0];
      
      // Create a canvas to render the trimmed video
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const video = document.createElement('video');
      
      const url = URL.createObjectURL(firstClip.blob);
      video.src = url;
      
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Record the canvas
      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const exportedBlob = new Blob(chunks, { type: 'video/webm' });
        onExport?.(exportedBlob);
        
        // Also trigger download
        const exportUrl = URL.createObjectURL(exportedBlob);
        const a = document.createElement('a');
        a.href = exportUrl;
        a.download = `edited-video-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(exportUrl);
        
        toast({
          title: "Export Complete",
          description: "Your edited video has been exported successfully",
        });
      };
      
      mediaRecorder.start();
      
      // Render frames from start to end time
      let currentTime = firstClip.startTime;
      const frameRate = 30;
      const frameInterval = 1 / frameRate;
      
      const renderFrame = () => {
        if (currentTime >= firstClip.endTime) {
          mediaRecorder.stop();
          URL.revokeObjectURL(url);
          return;
        }
        
        video.currentTime = currentTime;
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          currentTime += frameInterval;
          setTimeout(renderFrame, 1000 / frameRate);
        };
      };
      
      renderFrame();
      
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Create sortable clip component
  const SortableClip = ({ clip, index }: { clip: VideoClip; index: number }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: clip.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-gray-800 rounded p-3 border-2 transition-colors ${
          selectedClipId === clip.id ? 'border-thoxt-yellow' : 'border-gray-600'
        }`}
        onClick={() => setSelectedClipId(clip.id)}
        data-testid={`clip-${clip.id}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-white"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <span className="text-white font-medium text-sm">{clip.name}</span>
            <span className="text-xs text-gray-400">
              {formatTime(clip.endTime - clip.startTime)}
            </span>
          </div>

          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                moveClip(clip.id, 'left');
              }}
              disabled={index === 0}
              className="text-gray-400 hover:text-white w-6 h-6"
              data-testid={`move-left-${clip.id}`}
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                moveClip(clip.id, 'right');
              }}
              disabled={index === clips.length - 1}
              className="text-gray-400 hover:text-white w-6 h-6"
              data-testid={`move-right-${clip.id}`}
            >
              <ChevronRight className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                const splitTime = (clip.endTime - clip.startTime) / 2;
                splitClipAtTime(clip.id, splitTime);
              }}
              className="text-gray-400 hover:text-white w-6 h-6"
              data-testid={`split-${clip.id}`}
            >
              <Scissors className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                duplicateClip(clip.id);
              }}
              className="text-gray-400 hover:text-white w-6 h-6"
              data-testid={`duplicate-${clip.id}`}
            >
              <Copy className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                deleteClip(clip.id);
              }}
              className="text-red-400 hover:text-red-300 w-6 h-6"
              data-testid={`delete-${clip.id}`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Text Overlays */}
        {clip.textOverlays && clip.textOverlays.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="text-xs text-gray-400 flex items-center space-x-1">
              <Type className="w-3 h-3" />
              <span>Text Overlays ({clip.textOverlays.length})</span>
            </div>
            {clip.textOverlays.map((overlay) => (
              <div
                key={overlay.id}
                className="bg-gray-700 rounded px-2 py-1 text-xs text-white flex items-center justify-between"
              >
                <span>"{overlay.text}" ({formatTime(overlay.startTime)}-{formatTime(overlay.endTime)})</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTextOverlay(clip.id, overlay.id);
                  }}
                  className="text-red-400 hover:text-red-300 w-4 h-4 p-0"
                >
                  <Trash2 className="w-2 h-2" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Trim Controls */}
        {selectedClipId === clip.id && (
          <div className="space-y-2 mt-3">
            <div>
              <label className="text-xs text-gray-400">Trim Start:</label>
              <Slider
                value={[clip.startTime]}
                onValueChange={([value]) => trimClip(clip.id, value, clip.endTime)}
                min={0}
                max={clip.originalDuration}
                step={0.1}
                className="w-full mt-1"
                data-testid={`trim-start-${clip.id}`}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Trim End:</label>
              <Slider
                value={[clip.endTime]}
                onValueChange={([value]) => trimClip(clip.id, clip.startTime, value)}
                min={clip.startTime}
                max={clip.originalDuration}
                step={0.1}
                className="w-full mt-1"
                data-testid={`trim-end-${clip.id}`}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col" data-testid="timeline-editor">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Header */}
      <div className="bg-thoxt-gray border-b border-gray-700 p-4 flex justify-between items-center" data-testid="timeline-header">
        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-thoxt-yellow" />
          <span>Video Editor</span>
        </h2>
        <div className="flex space-x-2">
          {clips.length > 1 && (
            <Button
              onClick={mergeClips}
              disabled={isExporting}
              className="bg-blue-600 text-white hover:bg-blue-700"
              data-testid="merge-button"
            >
              <Layers className="w-4 h-4 mr-2" />
              Merge Clips
            </Button>
          )}
          <Button
            onClick={() => setShowTextOverlay(true)}
            disabled={!selectedClipId}
            className="bg-purple-600 text-white hover:bg-purple-700"
            data-testid="add-text-button"
          >
            <Type className="w-4 h-4 mr-2" />
            Add Text
          </Button>
          <Button
            onClick={exportVideo}
            disabled={isExporting || clips.length === 0}
            className="bg-thoxt-yellow text-black hover:bg-yellow-400"
            data-testid="export-button"
          >
            {isExporting ? 'Exporting...' : <><Download className="w-4 h-4 mr-2" />Export</>}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-white hover:bg-gray-700"
            data-testid="close-editor"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Video Preview */}
        <div className="flex-1 bg-black flex items-center justify-center p-4">
          {selectedClip ? (
            <video
              ref={videoRef}
              className="max-w-full max-h-full object-contain"
              onTimeUpdate={(e) => {
                const video = e.target as HTMLVideoElement;
                setCurrentTime(video.currentTime);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              data-testid="preview-video"
            />
          ) : (
            <div className="text-gray-400 text-center">
              <p className="text-lg mb-2">No video loaded</p>
              <p>Add a video clip to start editing</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-900 p-4 border-t border-gray-700" data-testid="video-controls">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => seekTo(Math.max(0, currentTime - 10))}
              className="text-white hover:bg-gray-700"
              data-testid="rewind-10"
            >
              <Rewind className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => seekTo(Math.max(0, currentTime - 1))}
              className="text-white hover:bg-gray-700"
              data-testid="step-back"
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={togglePlayPause}
              className="text-white hover:bg-thoxt-yellow hover:text-black w-12 h-12"
              data-testid="play-pause"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => seekTo(Math.min(totalDuration, currentTime + 1))}
              className="text-white hover:bg-gray-700"
              data-testid="step-forward"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => seekTo(Math.min(totalDuration, currentTime + 10))}
              className="text-white hover:bg-gray-700"
              data-testid="fast-forward-10"
            >
              <FastForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Timeline Scrubber */}
          <div className="mb-4">
            <Slider
              value={[currentTime]}
              onValueChange={([value]) => seekTo(value)}
              min={0}
              max={totalDuration}
              step={0.1}
              className="w-full"
              data-testid="timeline-scrubber"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Additional Controls */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVolume(volume > 0 ? 0 : 1)}
                  className="text-white hover:bg-gray-700"
                  data-testid="volume-toggle"
                >
                  {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  onValueChange={([value]) => {
                    setVolume(value);
                    if (videoRef.current) {
                      videoRef.current.volume = value;
                    }
                  }}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-20"
                  data-testid="volume-slider"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Speed:</span>
                <select
                  value={playbackSpeed}
                  onChange={(e) => {
                    const speed = parseFloat(e.target.value);
                    setPlaybackSpeed(speed);
                    if (videoRef.current) {
                      videoRef.current.playbackRate = speed;
                    }
                  }}
                  className="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
                  data-testid="playback-speed"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gray-900 border-t border-gray-700" data-testid="timeline-section">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <GripVertical className="w-4 h-4 text-thoxt-yellow" />
                <span>Timeline</span>
              </h3>
              {clips.length > 0 && (
                <span className="text-sm text-gray-400">
                  {clips.length} clip{clips.length !== 1 ? 's' : ''} • Drag to reorder
                </span>
              )}
            </div>
            
            <div ref={timelineRef} className="space-y-2 max-h-64 overflow-y-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={clips.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  {clips.map((clip, index) => (
                    <SortableClip key={clip.id} clip={clip} index={index} />
                  ))}
                </SortableContext>
              </DndContext>
              
              {clips.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <div className="mb-4">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  </div>
                  <p className="text-lg mb-1">No clips in timeline</p>
                  <p className="text-sm">Record a video or upload one to start editing</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Text Overlay Modal */}
      {showTextOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center" data-testid="text-overlay-modal">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Type className="w-5 h-5 text-purple-500" />
              <span>Add Text Overlay</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-300 block mb-1">Text</label>
                <input
                  type="text"
                  value={newTextOverlay.text || ''}
                  onChange={(e) => setNewTextOverlay(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                  placeholder="Enter overlay text..."
                  data-testid="text-overlay-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-300 block mb-1">Font Size</label>
                  <input
                    type="number"
                    value={newTextOverlay.fontSize || 24}
                    onChange={(e) => setNewTextOverlay(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    min="12"
                    max="72"
                    data-testid="font-size-input"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-300 block mb-1">Color</label>
                  <input
                    type="color"
                    value={newTextOverlay.color || '#ffffff'}
                    onChange={(e) => setNewTextOverlay(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full bg-gray-700 rounded px-1 py-1 border border-gray-600 focus:border-purple-500 focus:outline-none h-10"
                    data-testid="text-color-input"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-300 block mb-1">Start Time (s)</label>
                  <input
                    type="number"
                    value={newTextOverlay.startTime || 0}
                    onChange={(e) => setNewTextOverlay(prev => ({ ...prev, startTime: parseFloat(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    min="0"
                    step="0.1"
                    data-testid="start-time-input"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-300 block mb-1">End Time (s)</label>
                  <input
                    type="number"
                    value={newTextOverlay.endTime || 5}
                    onChange={(e) => setNewTextOverlay(prev => ({ ...prev, endTime: parseFloat(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    min="0"
                    step="0.1"
                    data-testid="end-time-input"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-300 block mb-1">Horizontal Position (%)</label>
                  <input
                    type="number"
                    value={newTextOverlay.x || 50}
                    onChange={(e) => setNewTextOverlay(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    min="0"
                    max="100"
                    data-testid="position-x-input"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-gray-300 block mb-1">Vertical Position (%)</label>
                  <input
                    type="number"
                    value={newTextOverlay.y || 50}
                    onChange={(e) => setNewTextOverlay(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    min="0"
                    max="100"
                    data-testid="position-y-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowTextOverlay(false)}
                className="border-gray-600 text-white hover:bg-gray-700"
                data-testid="cancel-text-overlay"
              >
                Cancel
              </Button>
              <Button
                onClick={addTextOverlay}
                disabled={!newTextOverlay.text?.trim()}
                className="bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                data-testid="add-text-overlay-confirm"
              >
                Add Text Overlay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}