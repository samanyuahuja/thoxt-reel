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
    
    const url = browserStorage.getVideoUrl(reel);
    if (url) {
      videoUrls.current[reel.id] = url;
    }
    return url;
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
    const videoUrl = getVideoUrl(reel);
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `${reel.title}.webm`;
      a.click();
      
      toast({
        title: "Download Started",
        description: "Your reel is being downloaded.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <SidebarNavigation />
      
      <div className="flex-1 ml-64">
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Reels</h1>
              {reels && (
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {filteredReels.length} saved reels
                </span>
              )}
            </div>
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              data-testid="create-new-reel-button"
            >
              Create New Reel
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search your reels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                data-testid="search-input"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-32" data-testid="filter-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6" data-testid="reels-grid">
                {filteredReels.map((reel) => (
                  <div key={reel.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Video Thumbnail */}
                    <div className="relative aspect-[9/16] bg-secondary overflow-hidden cursor-pointer group"
                         onClick={() => handleVideoPlay(reel.id)}>
                      
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
                              loop
                              muted
                              playsInline
                              preload="metadata"
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

                            {/* Play/Pause Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-100 opacity-0 transition-opacity">
                              {loadingVideos.has(reel.id) ? (
                                <div className="w-8 md:w-12 h-8 md:h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : playingVideo === reel.id ? (
                                <Pause className="w-8 md:w-12 h-8 md:h-12 text-white/90 bg-black/50 rounded-full p-2" />
                              ) : (
                                <Play className="w-8 md:w-12 h-8 md:h-12 text-white/90 bg-black/50 rounded-full p-2" />
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
                      <div className="absolute bottom-1 md:bottom-2 right-1 md:right-2 bg-black/75 text-primary-foreground px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs" data-testid={`duration-${reel.id}`}>
                        {formatDuration(reel.duration)}
                      </div>
                      
                      {/* Playing Indicator */}
                      {playingVideo === reel.id && (
                        <div className="absolute top-1 md:top-2 left-1 md:left-2 bg-primary text-primary-foreground px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-semibold">
                          Playing
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-2 md:p-4">
                      <h3 className="font-semibold text-sm md:text-lg mb-1 md:mb-2 line-clamp-2" data-testid={`reel-title-${reel.id}`}>
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
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs md:text-sm px-2 md:px-3"
                          onClick={() => handleVideoPlay(reel.id)}
                          data-testid={`play-button-${reel.id}`}
                        >
                          {playingVideo === reel.id ? (
                            <>
                              <Pause className="w-3 md:w-4 h-3 md:h-4 mr-1" />
                              <span className="hidden md:inline">Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 md:w-4 h-3 md:h-4 mr-1" />
                              <span className="hidden md:inline">Play</span>
                            </>
                          )}
                        </Button>
                        
                        <div className="flex space-x-0.5 md:space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground w-6 h-6 md:w-8 md:h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(reel);
                            }}
                            data-testid={`share-button-${reel.id}`}
                          >
                            <Share className="w-3 md:w-4 h-3 md:h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground w-6 h-6 md:w-8 md:h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(reel);
                            }}
                            data-testid={`download-button-${reel.id}`}
                          >
                            <Download className="w-3 md:w-4 h-3 md:h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-blue-400 w-6 h-6 md:w-8 md:h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingReel(reel);
                              setShowTimelineEditor(true);
                            }}
                            data-testid={`edit-button-${reel.id}`}
                          >
                            <Edit3 className="w-3 md:w-4 h-3 md:h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-400 w-6 h-6 md:w-8 md:h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReel(reel.id);
                            }}
                            data-testid={`delete-button-${reel.id}`}
                          >
                            <Trash2 className="w-3 md:w-4 h-3 md:h-4" />
                          </Button>
                        </div>
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