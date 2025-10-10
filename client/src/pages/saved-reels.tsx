import { useState, useEffect, useRef } from "react";
import SidebarNavigation from "@/components/ui/sidebar-navigation";
import { Search, Play, Share, Download, Trash2, Eye, Calendar, Clock, Filter, Pause, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { browserStorage, type StoredReel } from "@/lib/browser-storage";
import { useToast } from "@/hooks/use-toast";
import VideoTimelineEditor from "@/components/ui/video-timeline-editor";
import { createSampleReels } from "@/lib/sample-reels";


export default function SavedReels() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [reels, setReels] = useState<StoredReel[] | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [loadingVideos, setLoadingVideos] = useState<Set<string>>(new Set());
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTimelineEditor, setShowTimelineEditor] = useState(false);
  const [editingReel, setEditingReel] = useState<StoredReel | null>(null);
  
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  const videoUrls = useRef<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      setIsLoading(true);
      await browserStorage.init();
      let savedReels = await browserStorage.getAllReels();
      
      // If no reels exist, create sample reels for demo purposes
      if (savedReels.length === 0) {
        console.log('No reels found, creating sample reels...');
        await createSampleReels();
        savedReels = await browserStorage.getAllReels();
      } else {
        console.log(`Found ${savedReels.length} existing reels`);
      }
      
      setReels(savedReels);
      setError(null);
    } catch (err) {
      console.error('Failed to load reels:', err);
      setError('Failed to load saved reels');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReels = reels?.filter(reel => {
    const matchesSearch = reel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reel.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterBy === "all") return matchesSearch;
    if (filterBy === "recent") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return matchesSearch && reel.createdAt && new Date(reel.createdAt) > weekAgo;
    }
    if (filterBy === "popular") {
      return matchesSearch && (reel.views || 0) > 10;
    }
    return matchesSearch;
  }) || [];

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getVideoUrl = (reel: StoredReel): string | null => {
    if (videoUrls.current[reel.id]) {
      return videoUrls.current[reel.id];
    }
    
    // Load URL asynchronously
    browserStorage.getVideoUrl(reel).then(url => {
      if (url) {
        videoUrls.current[reel.id] = url;
        // Force re-render to update video src
        setReels(prev => prev ? [...prev] : null);
      }
    });
    
    return videoUrls.current[reel.id] || null;
  };

  // Clean up video URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(videoUrls.current).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleVideoPlay = async (reelId: string) => {
    const video = videoRefs.current[reelId];
    if (!video) {
      console.error(`Video element not found for reel ${reelId}`);
      return;
    }

    console.log(`Playing your recorded video for reel: ${reelId}`);
    console.log(`Video details:`, {
      src: video.src,
      duration: video.duration,
      readyState: video.readyState,
      networkState: video.networkState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight
    });

    // Pause any currently playing video
    if (playingVideo && playingVideo !== reelId) {
      const currentlyPlaying = videoRefs.current[playingVideo];
      if (currentlyPlaying) {
        currentlyPlaying.pause();
        console.log(`Paused previous video: ${playingVideo}`);
      }
    }

    if (playingVideo === reelId) {
      // Pause current video
      video.pause();
      setPlayingVideo(null);
      console.log(`Paused your video: ${reelId}`);
    } else {
      // Play your recorded video
      try {
        setLoadingVideos(prev => {
          const newSet = new Set(prev);
          newSet.add(reelId);
          return newSet;
        });
        
        // Ensure video is loaded before playing
        if (video.readyState < 2) {
          console.log(`Video not ready, loading... (readyState: ${video.readyState})`);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              video.removeEventListener('loadeddata', onLoadedData);
              video.removeEventListener('error', onError);
              reject(new Error('Video loading timeout'));
            }, 10000); // Extended timeout for larger recorded videos

            const onLoadedData = () => {
              clearTimeout(timeout);
              video.removeEventListener('loadeddata', onLoadedData);
              video.removeEventListener('error', onError);
              console.log(`Your video loaded! Duration: ${video.duration}s, readyState: ${video.readyState}`);
              resolve(null);
            };
            
            const onError = (e: Event) => {
              clearTimeout(timeout);
              video.removeEventListener('loadeddata', onLoadedData);
              video.removeEventListener('error', onError);
              console.error('Video loading error:', e, video.error);
              reject(e);
            };
            
            video.addEventListener('loadeddata', onLoadedData);
            video.addEventListener('error', onError);
            video.load();
          });
        }
        
        console.log(`Starting playback of your recorded video: ${reelId}`);
        await video.play();
        console.log(`Your video is playing! Current time: ${video.currentTime}s / ${video.duration}s`);
        
        setPlayingVideo(reelId);
        setLoadingVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(reelId);
          return newSet;
        });
        
        // Update view count
        await browserStorage.updateReelViews(reelId);
        loadReels(); // Refresh to show updated view count
        
      } catch (error) {
        console.error('Error playing your recorded video:', error);
        setLoadingVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(reelId);
          return newSet;
        });
        toast({
          title: "Video Playback Error",
          description: "Unable to play your recorded video. The video file may be corrupted or not compatible with this browser.",
          variant: "destructive"
        });
      }
    }
  };

  const handleVideoEnded = (reelId: string) => {
    setPlayingVideo(null);
    setVideoProgress(prev => ({ ...prev, [reelId]: 0 }));
  };

  const handleVideoProgress = (reelId: string) => {
    // Simulate progress for demo
    if (playingVideo === reelId) {
      const progress = Math.random() * 100;
      setVideoProgress(prev => ({ ...prev, [reelId]: progress }));
    }
  };

  const handleVideoSeek = (reelId: string, progress: number) => {
    setVideoProgress(prev => ({ ...prev, [reelId]: progress }));
  };

  const handleDeleteReel = async (reelId: string) => {
    try {
      await browserStorage.deleteReel(reelId);
      await loadReels();
      toast({
        title: "Reel Deleted",
        description: "The reel has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Unable to delete the reel. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShare = (reel: StoredReel) => {
    if (navigator.share) {
      navigator.share({
        title: reel.title,
        text: reel.description || '',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Reel link copied to clipboard!",
      });
    }
  };

  const handleDownload = async (reel: StoredReel) => {
    try {
      const videoUrl = await browserStorage.getVideoUrl(reel);
      if (videoUrl) {
        // Fetch the blob and create a proper download
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${reel.title.replace(/[^a-z0-9]/gi, '_')}.webm`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "✅ Download Complete",
          description: `${reel.title} has been downloaded successfully!`,
        });
      } else {
        toast({
          title: "Download Failed",
          description: "Video not available for download.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Failed to download the video. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex">
      <SidebarNavigation />
      
      <div className="flex-1 ml-64">
        <div className="p-4 md:p-8">
          {/* Header with gradient */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                My Reels
              </h1>
              {reels && (
                <span className="bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary px-4 py-1.5 rounded-full text-sm font-semibold border border-primary/20 backdrop-blur-sm">
                  {filteredReels.length} reels
                </span>
              )}
            </div>
            <Button 
              className="bg-gradient-to-r from-primary to-purple-600 text-white hover:from-primary/90 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              data-testid="create-new-reel-button"
            >
              <Play className="w-4 h-4 mr-2" />
              Create New Reel
            </Button>
          </div>

          {/* Search and Filters - Enhanced */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search your amazing reels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                data-testid="search-input"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-primary/20">
                <Filter className="w-4 h-4 text-primary" />
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-32 border-0 focus:ring-0" data-testid="filter-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reels</SelectItem>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="popular">Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Loading your reels...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-destructive text-lg font-semibold mb-2">Error Loading Reels</div>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={loadReels} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : filteredReels.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Reels Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterBy !== "all" 
                    ? "No reels match your search or filter criteria." 
                    : "Start creating your first reel to see it here!"}
                </p>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  data-testid="empty-state-create-button"
                >
                  Create Your First Reel
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="reels-grid">
                {filteredReels.map((reel) => (
                  <div key={reel.id} className="group bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-primary/10 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 transform hover:-translate-y-1">
                    {/* Video Thumbnail */}
                    <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/5 to-purple-500/5 overflow-hidden cursor-pointer">
                      
                      {/* Your Actual Recorded Videos */}
                      {(() => {
                        const videoUrl = getVideoUrl(reel);
                        console.log(`Video URL for ${reel.id}:`, videoUrl);
                        return videoUrl ? (
                          <>
                            <video 
                              ref={(el) => {
                                if (el) {
                                  videoRefs.current[reel.id] = el;
                                }
                              }}
                              className="w-full h-full object-cover"
                              poster={reel.thumbnailData || undefined}
                              controls
                              loop
                              muted
                              playsInline
                              preload="auto"
                              autoPlay
                              onLoadedData={() => {
                                console.log(`Video loaded for ${reel.id}:`, {
                                  duration: videoRefs.current[reel.id]?.duration,
                                  readyState: videoRefs.current[reel.id]?.readyState
                                });
                                setLoadingVideos(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(reel.id);
                                  return newSet;
                                })
                              }}
                              onError={(e) => {
                                console.error(`Video error for ${reel.id}:`, e);
                              }}
                              data-testid={`reel-video-${reel.id}`}
                              src={videoUrl}
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            {/* Play/Pause Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              {loadingVideos.has(reel.id) ? (
                                <div className="w-12 md:w-16 h-12 md:h-16 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : playingVideo === reel.id ? (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Pause className="w-12 md:w-16 h-12 md:h-16 text-white bg-gradient-to-br from-primary to-purple-600 rounded-full p-3 shadow-xl" />
                                </div>
                              ) : (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play className="w-12 md:w-16 h-12 md:h-16 text-white bg-gradient-to-br from-primary to-purple-600 rounded-full p-3 shadow-xl" />
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          /* Fallback when no recorded video data */
                          <div className="w-full h-full relative bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="text-lg font-bold mb-2">{reel.title.split(' ').slice(0, 2).join(' ')}</div>
                              <div className="text-sm opacity-80">No recorded video found</div>
                            </div>
                            
                            <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity">
                              <Play className="w-8 md:w-12 h-8 md:h-12 text-white/90 bg-black/50 rounded-full p-2" />
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-gradient-to-r from-black/80 to-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold border border-white/10" data-testid={`duration-${reel.id}`}>
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDuration(reel.duration)}
                      </div>
                      
                      {/* Playing Indicator */}
                      {playingVideo === reel.id && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-primary to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                          Playing
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-base md:text-lg mb-2 line-clamp-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent" data-testid={`reel-title-${reel.id}`}>
                        {reel.title}
                      </h3>
                      
                      {reel.description && (
                        <p className="text-muted-foreground text-xs md:text-sm mb-2 md:mb-3 line-clamp-2 hidden md:block" data-testid={`reel-description-${reel.id}`}>
                          {reel.description}
                        </p>
                      )}
                      
                      {/* Stats - Hidden on mobile */}
                      <div className="hidden md:flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{reel.views || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{reel.createdAt ? formatDate(reel.createdAt) : 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions - Enhanced */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white transition-all shadow-md hover:shadow-lg"
                          onClick={() => handleVideoPlay(reel.id)}
                          data-testid={`play-button-${reel.id}`}
                        >
                          {playingVideo === reel.id ? (
                            <>
                              <Pause className="w-4 h-4 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Play
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-primary/20 hover:bg-primary/10 hover:text-primary transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(reel);
                          }}
                          data-testid={`download-button-${reel.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-primary/20 hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(reel);
                          }}
                          data-testid={`share-button-${reel.id}`}
                        >
                          <Share className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-primary/20 hover:bg-purple-500/10 hover:text-purple-500 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingReel(reel);
                            setShowTimelineEditor(true);
                          }}
                          data-testid={`edit-button-${reel.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-primary/20 hover:bg-red-500/10 hover:text-red-500 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReel(reel.id);
                          }}
                          data-testid={`delete-button-${reel.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Video Timeline Editor */}
      <VideoTimelineEditor
        isOpen={showTimelineEditor}
        onClose={() => {
          setShowTimelineEditor(false);
          setEditingReel(null);
        }}
        initialVideo={undefined} // TODO: Convert video data back to blob for editing
        onExport={async (editedBlob) => {
          if (editingReel) {
            // Save the edited version as a new reel
            await browserStorage.saveReel({
              title: `${editingReel.title} (Edited)`,
              description: editingReel.description,
              duration: editingReel.duration,
              script: editingReel.script,
              videoBlob: editedBlob,
              thumbnailUrl: null,
              authorId: editingReel.authorId,
              sourceArticleId: editingReel.sourceArticleId,
              metadata: editingReel.metadata,
              views: 0,
              likes: 0
            });
            
            await loadReels();
            toast({
              title: "Reel Edited",
              description: "Your edited reel has been saved!",
            });
          }
        }}
      />
    </div>
  );
}