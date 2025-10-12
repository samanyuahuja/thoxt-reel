import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import SidebarNavigation from "@/components/ui/sidebar-navigation";
import VideoRecorder from "@/components/ui/video-recorder";
import AIToolsSidebar from "@/components/ui/ai-tools-sidebar";
import ProfessionalTextOverlayModal, { type TextOverlay } from "@/components/ui/professional-text-overlay-modal";
import InstagramFiltersModal, { type VideoFilter } from "@/components/ui/instagram-filters-modal";
import MusicModal, { type MusicTrack } from "@/components/ui/music-modal";
import { Search, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function ReelsCreator() {
  const [, setLocation] = useLocation();
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [currentScript, setCurrentScript] = useState("");
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<VideoFilter | undefined>();
  const [currentMusic, setCurrentMusic] = useState<MusicTrack | undefined>();
  const [showAITools, setShowAITools] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle swipe right to exit
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
    touchEndRef.current = e.touches[0].clientX; // Reset end to start position
    setSwipeOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.touches[0].clientX;
    const distance = touchEndRef.current - touchStartRef.current;
    // Only show animation for rightward swipes
    if (distance > 0) {
      setSwipeOffset(distance);
    }
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchEndRef.current - touchStartRef.current;
    if (swipeDistance > 100) { // Swiped right at least 100px
      setIsExiting(true);
      setTimeout(() => {
        setLocation('/reel-options');
      }, 300); // Match animation duration
    } else {
      // Snap back if not enough distance
      setSwipeOffset(0);
    }
    // Reset refs
    touchStartRef.current = 0;
    touchEndRef.current = 0;
  };

  const handleAddTextOverlay = (overlay: TextOverlay) => {
    setTextOverlays(prev => [...prev, overlay]);
  };

  const getCurrentTime = () => {
    // This would normally come from the video recorder's current recording time
    // For now, we'll use a simple timestamp since recording start
    return Date.now() - recordingStartTime;
  };

  // Mobile fullscreen mode
  if (isMobile) {
    return (
      <div 
        className="fixed inset-0 bg-black z-50 transition-transform duration-300"
        style={{
          transform: `translateX(${isExiting ? '100%' : swipeOffset > 0 ? swipeOffset : 0}px)`,
          transition: isExiting || swipeOffset === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid="mobile-fullscreen-recorder"
      >
        <VideoRecorder
          onOpenFilters={() => setShowFiltersModal(true)}
          onOpenMusic={() => setShowMusicModal(true)}
          onOpenText={() => setShowTextModal(true)}
          onClose={() => setLocation('/reel-options')}
          currentScript={currentScript}
          textOverlays={textOverlays}
          onUpdateOverlays={setTextOverlays}
          recordingStartTime={recordingStartTime}
          currentFilter={currentFilter}
          currentMusic={currentMusic}
        />

        {/* Mobile AI Tools - Bottom Sheet */}
        {showAITools && (
          <div className="fixed inset-x-0 bottom-0 top-1/3 bg-background border-t border-border z-50 overflow-y-auto rounded-t-3xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">AI Tools</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAITools(false)}
                  className="text-muted-foreground"
                >
                  Close
                </Button>
              </div>
              <AIToolsSidebar
                onScriptGenerated={setCurrentScript}
              />
            </div>
          </div>
        )}

        {/* Modals */}
        <InstagramFiltersModal
          isOpen={showFiltersModal}
          onClose={() => setShowFiltersModal(false)}
          onApplyFilter={setCurrentFilter}
          currentFilter={currentFilter}
        />

        <MusicModal
          isOpen={showMusicModal}
          onClose={() => setShowMusicModal(false)}
          onSelectTrack={(track) => setCurrentMusic(track || undefined)}
          currentTrack={currentMusic}
        />

        <ProfessionalTextOverlayModal
          isOpen={showTextModal}
          onClose={() => setShowTextModal(false)}
          onAddOverlay={handleAddTextOverlay}
          currentTime={getCurrentTime()}
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Left Sidebar Navigation */}
      <SidebarNavigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <header className="bg-background border-b border-border p-4" data-testid="header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-foreground" data-testid="title">Thoxt Reels</h2>
              <span className="text-primary text-sm bg-secondary px-2 py-1 rounded" data-testid="subtitle">
                AI Creator Studio
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search articles, authors, genres..." 
                  className="bg-input text-foreground px-4 py-2 rounded-full w-80 focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                  data-testid="search-input"
                />
                <Search className="absolute right-3 top-3 text-muted-foreground w-4 h-4" />
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Studio Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video Recording Area */}
          <div className="flex-1 flex items-center justify-center bg-muted p-6" data-testid="video-area">
            <VideoRecorder
              onOpenFilters={() => setShowFiltersModal(true)}
              onOpenMusic={() => setShowMusicModal(true)}
              onOpenText={() => setShowTextModal(true)}
              currentScript={currentScript}
              textOverlays={textOverlays}
              onUpdateOverlays={setTextOverlays}
              recordingStartTime={recordingStartTime}
              currentFilter={currentFilter}
              currentMusic={currentMusic}
            />
          </div>

          {/* Desktop AI Tools Sidebar */}
          <div>
            <AIToolsSidebar
              onScriptGenerated={setCurrentScript}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <InstagramFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApplyFilter={setCurrentFilter}
        currentFilter={currentFilter}
      />

      <MusicModal
        isOpen={showMusicModal}
        onClose={() => setShowMusicModal(false)}
        onSelectTrack={(track) => setCurrentMusic(track || undefined)}
        currentTrack={currentMusic}
      />

      <ProfessionalTextOverlayModal
        isOpen={showTextModal}
        onClose={() => setShowTextModal(false)}
        onAddOverlay={handleAddTextOverlay}
        currentTime={getCurrentTime()}
      />
    </div>
  );
}