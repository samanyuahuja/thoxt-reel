import { useState, useRef, useEffect } from "react";
import SidebarNavigation from "@/components/ui/sidebar-navigation";
import { Search, Play, Share, Download, Trash2, Eye, Calendar, Clock, Filter, Pause, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { browserStorage, type StoredReel } from "@/lib/browser-storage";
import { useToast } from "@/hooks/use-toast";
import VideoTimelineEditor from "@/components/ui/video-timeline-editor";


export default function SavedReels() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [reels, setReels] = useState<StoredReel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const videoUrls = useRef<{ [key: string]: string }>({});
  const { toast } = useToast();
  const [showTimelineEditor, setShowTimelineEditor] = useState(false);
  const [editingReel, setEditingReel] = useState<StoredReel | null>(null);

  // Load saved reels from browser storage
  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      setIsLoading(true);
      await browserStorage.init();
      const savedReels = await browserStorage.getAllReels();
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
    if (filterBy === "short" && reel.duration <= 30) return matchesSearch;
    if (filterBy === "medium" && reel.duration > 30 && reel.duration <= 60) return matchesSearch;
    if (filterBy === "long" && reel.duration > 60) return matchesSearch;
    
    return matchesSearch;
  });

  const sortedReels = filteredReels?.sort((a, b) => {
    switch (sortBy) {
      case "recent":
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      case "oldest":
        const oldDateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const oldDateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return oldDateA - oldDateB;
      case "title":
        return a.title.localeCompare(b.title);
      case "duration":
        return b.duration - a.duration;
      case "views":
        return (b.views || 0) - (a.views || 0);
      default:
        return 0;
    }
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get or create video URL for a reel
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
    if (!video) return;

    // Pause any currently playing video
    if (playingVideo && playingVideo !== reelId) {
      const currentlyPlaying = videoRefs.current[playingVideo];
      if (currentlyPlaying) {
        currentlyPlaying.pause();
      }
    }

    if (playingVideo === reelId) {
      // Pause current video
      video.pause();
      setPlayingVideo(null);
    } else {
      // Play selected video
      try {
        await video.play();
        setPlayingVideo(reelId);
        // Update view count
        await browserStorage.updateReelViews(reelId);
        loadReels(); // Refresh to show updated view count
      } catch (error) {
        console.error('Error playing video:', error);
        toast({
          title: "Playback Error",
          description: "Unable to play this video. It may be corrupted.",
          variant: "destructive"
        });
      }
    }
  };

  const handleVideoEnded = (reelId: string) => {
    setPlayingVideo(null);
  };

  const handleDeleteReel = async (reelId: string) => {
    if (!confirm('Are you sure you want to delete this reel? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Clean up video URL
      if (videoUrls.current[reelId]) {
        URL.revokeObjectURL(videoUrls.current[reelId]);
        delete videoUrls.current[reelId];
      }
      
      await browserStorage.deleteReel(reelId);
      loadReels(); // Refresh the list
      
      toast({
        title: "Reel Deleted",
        description: "Your reel has been successfully deleted."
      });
    } catch (error) {
      console.error('Error deleting reel:', error);
      toast({
        title: "Delete Failed",
        description: "Unable to delete the reel. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = (reel: StoredReel) => {
    const videoUrl = getVideoUrl(reel);
    if (!videoUrl) {
      toast({
        title: "Download Failed",
        description: "Unable to download this video.",
        variant: "destructive"
      });
      return;
    }
    
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${reel.title.replace(/[^a-zA-Z0-9]/g, '_')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: "Download Started",
      description: "Your video is being downloaded."
    });
  };

  const handleShare = async (reel: StoredReel) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: reel.title,
          text: reel.description || 'Check out this reel!',
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy URL to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Link copied to clipboard!"
        });
      } catch (error) {
        toast({
          title: "Share Failed",
          description: "Unable to share this reel.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <>
      <div className="flex h-screen bg-thoxt-dark text-white">
      {/* Left Sidebar Navigation */}
      <SidebarNavigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 pt-16 md:pt-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-thoxt-dark border-b border-gray-800 p-4" data-testid="mobile-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold" data-testid="mobile-page-title">My Reels</h1>
              <span className="text-thoxt-yellow text-xs bg-thoxt-gray px-2 py-1 rounded" data-testid="mobile-reels-count">
                {sortedReels?.length || 0}
              </span>
            </div>
            
            <Button 
              className="bg-thoxt-yellow text-black hover:bg-yellow-400 transition-colors text-sm px-3 py-1"
              data-testid="mobile-create-new-reel"
            >
              + New
            </Button>
          </div>
        </div>

        {/* Desktop Header */}
        <header className="hidden md:block bg-thoxt-dark border-b border-gray-800 p-4" data-testid="saved-reels-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold" data-testid="page-title">My Reels</h1>
              <span className="text-thoxt-yellow text-sm bg-thoxt-gray px-2 py-1 rounded" data-testid="reels-count">
                {sortedReels?.length || 0} saved reels
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search your reels..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800 text-white px-4 py-2 rounded-full w-80 focus:outline-none focus:ring-2 focus:ring-thoxt-yellow pr-10"
                  data-testid="search-input"
                />
                <Search className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Search */}
        <div className="md:hidden bg-thoxt-dark border-b border-gray-800 px-4 pb-4" data-testid="mobile-search">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search reels..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-thoxt-yellow pr-10 text-sm"
              data-testid="mobile-search-input"
            />
            <Search className="absolute right-3 top-2.5 text-gray-400 w-4 h-4" />
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="bg-thoxt-dark border-b border-gray-800 px-4 py-3" data-testid="controls-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center space-x-1 md:space-x-2">
                <Filter className="text-gray-400 w-4 h-4 hidden md:block" />
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="bg-gray-800 text-white border-gray-700 w-24 md:w-40 text-xs md:text-sm" data-testid="filter-select">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="short">Short (≤30s)</SelectItem>
                    <SelectItem value="medium">Medium (30-60s)</SelectItem>
                    <SelectItem value="long">Long (&gt;60s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-800 text-white border-gray-700 w-24 md:w-40 text-xs md:text-sm" data-testid="sort-select">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="views">Views</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="hidden md:block bg-thoxt-yellow text-black hover:bg-yellow-400 transition-colors"
              data-testid="create-new-reel"
            >
              Create New Reel
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-thoxt-gray overflow-y-auto" data-testid="reels-content">
          <div className="p-3 md:p-6 pb-20">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-thoxt-yellow mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading your reels...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-red-400">
                  <p>Failed to load reels. Please try again.</p>
                </div>
              </div>
            ) : !sortedReels || sortedReels.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-12 h-12 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No reels yet</h3>
                  <p className="text-gray-400 mb-4 text-sm md:text-base">
                    {searchQuery || filterBy !== "all" 
                      ? "No reels match your search or filter criteria." 
                      : "Start creating your first reel to see it here!"}
                  </p>
                  <Button 
                    className="bg-thoxt-yellow text-black hover:bg-yellow-400 transition-colors"
                    data-testid="empty-state-create-button"
                  >
                    Create Your First Reel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 pb-16" data-testid="reels-grid">
                {sortedReels.map((reel) => (
                  <div 
                    key={reel.id}
                    className="bg-thoxt-dark rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all md:hover:scale-105 group"
                    data-testid={`reel-card-${reel.id}`}
                  >
                    {/* Video Thumbnail */}
                    <div className="relative aspect-[9/16] bg-gray-800 overflow-hidden cursor-pointer"
                         onClick={() => handleVideoPlay(reel.id)}>
                      {(() => {
                        const videoUrl = getVideoUrl(reel);
                        return videoUrl ? (
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
                            onEnded={() => handleVideoEnded(reel.id)}
                            data-testid={`reel-video-${reel.id}`}
                            src={videoUrl}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            <Play className="w-16 h-16 text-gray-500" />
                          </div>
                        );
                      })()}
                      
                      {/* Play/Pause Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        {playingVideo === reel.id ? (
                          <Pause className="w-8 md:w-12 h-8 md:h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <Play className="w-8 md:w-12 h-8 md:h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      
                      {/* Duration Badge */}
                      <div className="absolute bottom-1 md:bottom-2 right-1 md:right-2 bg-black bg-opacity-75 text-white px-1.5 md:px-2 py-0.5 md:py-1 rounded text-xs" data-testid={`duration-${reel.id}`}>
                        {formatDuration(reel.duration)}
                      </div>
                      
                      {/* Playing Indicator */}
                      {playingVideo === reel.id && (
                        <div className="absolute top-1 md:top-2 left-1 md:left-2 bg-thoxt-yellow text-black px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-xs font-semibold">
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
                        <p className="text-gray-400 text-xs md:text-sm mb-2 md:mb-3 line-clamp-2 hidden md:block" data-testid={`reel-description-${reel.id}`}>
                          {reel.description}
                        </p>
                      )}
                      
                      {/* Stats - Hidden on mobile */}
                      <div className="hidden md:flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>{reel.views || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(reel.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-thoxt-yellow hover:bg-thoxt-yellow hover:text-black transition-colors text-xs md:text-sm px-2 md:px-3"
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
                            className="text-gray-400 hover:text-white w-6 h-6 md:w-8 md:h-8"
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
                            className="text-gray-400 hover:text-white w-6 h-6 md:w-8 md:h-8"
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
                            className="text-gray-400 hover:text-blue-400 w-6 h-6 md:w-8 md:h-8"
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
                            className="text-gray-400 hover:text-red-400 w-6 h-6 md:w-8 md:h-8"
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
      
      <VideoTimelineEditor
      isOpen={showTimelineEditor}
      onClose={() => {
        setShowTimelineEditor(false);
        setEditingReel(null);
      }}
      initialVideo={editingReel ? browserStorage.getVideoBlob(editingReel) || undefined : undefined}
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
            metadata: { ...editingReel.metadata, edited: true },
            views: 0,
            likes: 0
          });
          
          fetchReels();
          toast({
            title: "Edited Video Saved",
            description: "Your edited video has been saved as a new reel."
          });
        }
        setShowTimelineEditor(false);
        setEditingReel(null);
      }}
    />
    </>
  );
}