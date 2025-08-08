import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Upload, X, Play, Pause, RotateCcw, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { browserStorage } from "@/lib/browser-storage";

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoUploaded?: (videoBlob: Blob) => void;
}

export default function VideoUploadModal({ 
  isOpen, 
  onClose, 
  onVideoUploaded 
}: VideoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a video file (MP4, WebM, MOV, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a video file smaller than 100MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Set default title from filename
    setTitle(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      // Simulate file input change
      const fakeEvent = {
        target: { files: [videoFile] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Calculate video duration
      const duration = videoRef.current?.duration || 0;
      
      // Save to browser storage
      await browserStorage.saveReel({
        title: title || "Uploaded Video",
        description: description || undefined,
        duration: Math.round(duration),
        script: null,
        videoBlob: selectedFile,
        thumbnailUrl: null,
        authorId: null,
        sourceArticleId: null,
        metadata: { 
          uploaded: true,
          originalFileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type
        },
        views: 0,
        likes: 0
      });

      toast({
        title: "Video Uploaded!",
        description: "Your video has been successfully uploaded and saved.",
      });

      // Notify parent component
      onVideoUploaded?.(selectedFile);
      
      // Clean up and close
      handleClose();
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: "Unable to upload your video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setTitle("");
    setDescription("");
    setIsPlaying(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-thoxt-gray border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="video-upload-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center" data-testid="upload-modal-title">
            <Upload className="text-thoxt-yellow mr-2 w-6 h-6" />
            Upload Video
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {!selectedFile ? (
            /* Upload Area */
            <div
              className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-thoxt-yellow transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              data-testid="upload-dropzone"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload a Video</h3>
              <p className="text-gray-400 mb-4">
                Drag and drop your video file here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports MP4, WebM, MOV, AVI (Max 100MB)
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="file-input"
              />
              
              <Button 
                className="mt-4 bg-thoxt-yellow text-black hover:bg-yellow-400"
                data-testid="browse-button"
              >
                Browse Files
              </Button>
            </div>
          ) : (
            /* Preview and Edit Area */
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="bg-black rounded-lg overflow-hidden relative" data-testid="video-preview">
                <video
                  ref={videoRef}
                  src={previewUrl}
                  className="w-full max-h-64 object-contain"
                  onEnded={handleVideoEnded}
                  onLoadedMetadata={() => {
                    // Video metadata loaded, can access duration
                  }}
                  data-testid="preview-video"
                />
                
                {/* Video Controls Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center group">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={togglePlayPause}
                    data-testid="preview-play-button"
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                  </Button>
                </div>
              </div>
              
              {/* File Info */}
              <div className="bg-gray-800 rounded p-3 text-sm" data-testid="file-info">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">File:</span> {selectedFile.name}
                  </div>
                  <div>
                    <span className="text-gray-400">Size:</span> {formatFileSize(selectedFile.size)}
                  </div>
                  <div>
                    <span className="text-gray-400">Type:</span> {selectedFile.type}
                  </div>
                  <div>
                    <span className="text-gray-400">Duration:</span> 
                    {videoRef.current?.duration ? formatDuration(videoRef.current.duration) : 'Loading...'}
                  </div>
                </div>
              </div>
              
              {/* Metadata Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title"
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-thoxt-yellow"
                    data-testid="title-input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description for your video"
                    rows={3}
                    className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-thoxt-yellow resize-none"
                    data-testid="description-input"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-gray-700" data-testid="modal-actions">
            <Button
              variant="outline"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              onClick={handleClose}
              data-testid="cancel-upload"
            >
              Cancel
            </Button>
            
            <div className="flex space-x-3">
              {selectedFile && (
                <Button
                  variant="outline"
                  className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                  onClick={() => {
                    setSelectedFile(null);
                    setTitle("");
                    setDescription("");
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl("");
                    }
                  }}
                  data-testid="remove-file"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              )}
              
              <Button
                className="bg-thoxt-yellow text-black hover:bg-yellow-400 disabled:opacity-50"
                onClick={handleUpload}
                disabled={!selectedFile || !title.trim() || isUploading}
                data-testid="upload-button"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Upload Video
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}