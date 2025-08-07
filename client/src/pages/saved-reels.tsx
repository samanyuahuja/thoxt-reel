import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import SidebarNavigation from "@/components/ui/sidebar-navigation";
import { Search, Play, Share, Download, Trash2, Eye, Calendar, Clock, Filter, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SavedReel {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  duration: number;
  script?: string;
  createdAt: string;
  views: number;
  likes: number;
  metadata?: any;
}

export default function SavedReels() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Fetch saved reels
  const { data: reels, isLoading, error } = useQuery<SavedReel[]>({
    queryKey: ["/api/reels"],
  });

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
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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
      } catch (error) {
        console.error('Error playing video:', error);
        // Handle invalid blob URLs
        alert('This video is no longer available. It may have been recorded in a previous session.');
      }
    }
  };

  const handleVideoEnded = (reelId: string) => {
    setPlayingVideo(null);
  };

  return (
    <div className="flex bg-thoxt-dark text-white" style={{ height: '100vh' }}>
      {/* Left Sidebar Navigation */}
      <SidebarNavigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col" style={{ height: '100vh' }}>
        {/* Header */}
        <header className="bg-thoxt-dark border-b border-gray-800 p-4" data-testid="saved-reels-header">
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

        {/* Filters and Sorting */}
        <div className="bg-thoxt-dark border-b border-gray-800 px-4 py-3" data-testid="controls-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400 w-4 h-4" />
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="bg-gray-800 text-white border-gray-700 w-40" data-testid="filter-select">
                    <SelectValue placeholder="Filter by duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-gray-700">
                    <SelectItem value="all">All Reels</SelectItem>
                    <SelectItem value="short">Short (≤30s)</SelectItem>
                    <SelectItem value="medium">Medium (30-60s)</SelectItem>
                    <SelectItem value="long">Long (&gt;60s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-800 text-white border-gray-700 w-40" data-testid="sort-select">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              className="bg-thoxt-yellow text-black hover:bg-yellow-400 transition-colors"
              data-testid="create-new-reel"
            >
              Create New Reel
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-thoxt-gray" data-testid="reels-content">
          <div className="h-full overflow-y-auto p-6 pb-16" style={{ maxHeight: 'calc(100vh - 140px)' }}>
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
                  <p className="text-gray-400 mb-4">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="reels-grid">
                {sortedReels.map((reel) => (
                  <div 
                    key={reel.id}
                    className="bg-thoxt-dark rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
                    data-testid={`reel-card-${reel.id}`}
                  >
                    {/* Video Thumbnail */}
                    <div className="relative aspect-[9/16] bg-gray-800 overflow-hidden cursor-pointer"
                         onClick={() => handleVideoPlay(reel.id)}>
                      {reel.videoUrl ? (
                        <video 
                          ref={(el) => {
                            if (el) {
                              videoRefs.current[reel.id] = el;
                            }
                          }}
                          className="w-full h-full object-cover"
                          poster="/api/placeholder/320/568"
                          loop
                          muted
                          playsInline
                          onEnded={() => handleVideoEnded(reel.id)}
                          data-testid={`reel-video-${reel.id}`}
                        >
                          <source src={reel.videoUrl} type="video/webm" />
                          <source src={reel.videoUrl} type="video/mp4" />
                        </video>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                          <Play className="w-16 h-16 text-gray-500" />
                        </div>
                      )}
                      
                      {/* Play/Pause Overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                        {playingVideo === reel.id ? (
                          <Pause className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs" data-testid={`duration-${reel.id}`}>
                        {formatDuration(reel.duration)}
                      </div>
                      
                      {/* Playing Indicator */}
                      {playingVideo === reel.id && (
                        <div className="absolute top-2 left-2 bg-thoxt-yellow text-black px-2 py-1 rounded-full text-xs font-semibold">
                          Playing
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2" data-testid={`reel-title-${reel.id}`}>
                        {reel.title}
                      </h3>
                      
                      {reel.description && (
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2" data-testid={`reel-description-${reel.id}`}>
                          {reel.description}
                        </p>
                      )}
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
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
                          className="text-thoxt-yellow hover:bg-thoxt-yellow hover:text-black transition-colors"
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
                        
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white"
                            data-testid={`share-button-${reel.id}`}
                          >
                            <Share className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white"
                            data-testid={`download-button-${reel.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-400"
                            data-testid={`delete-button-${reel.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
}