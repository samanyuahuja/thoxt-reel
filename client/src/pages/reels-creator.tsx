import { useState } from "react";
import SidebarNavigation from "@/components/ui/sidebar-navigation";
import VideoRecorder from "@/components/ui/video-recorder";
import AIToolsSidebar from "@/components/ui/ai-tools-sidebar";
import TextOverlayModal, { type TextOverlay } from "@/components/ui/text-overlay-modal";
import FiltersModal, { type VideoFilter } from "@/components/ui/filters-modal";
import MusicModal, { type MusicTrack } from "@/components/ui/music-modal";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReelsCreator() {
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [currentScript, setCurrentScript] = useState("");
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<VideoFilter | undefined>();
  const [currentMusic, setCurrentMusic] = useState<MusicTrack | undefined>();
  const [showAITools, setShowAITools] = useState(false);

  const handleAddTextOverlay = (overlay: TextOverlay) => {
    setTextOverlays(prev => [...prev, overlay]);
  };

  const getCurrentTime = () => {
    // This would normally come from the video recorder's current recording time
    // For now, we'll use a simple timestamp since recording start
    return Date.now() - recordingStartTime;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-thoxt-dark text-white">
      {/* Left Sidebar Navigation */}
      <SidebarNavigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pt-16 md:pt-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-thoxt-dark border-b border-gray-800 p-4 flex items-center justify-between" data-testid="mobile-header">
          <h2 className="text-xl font-bold" data-testid="mobile-title">Thoxt Reels</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-thoxt-yellow"
            onClick={() => setShowAITools(!showAITools)}
            data-testid="mobile-ai-tools-toggle"
          >
            <Menu className="w-5 h-5 mr-1" />
            AI Tools
          </Button>
        </div>

        {/* Desktop Header */}
        <header className="hidden md:block bg-thoxt-dark border-b border-gray-800 p-4" data-testid="header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold" data-testid="title">Thoxt Reels</h2>
              <span className="text-thoxt-yellow text-sm bg-thoxt-gray px-2 py-1 rounded" data-testid="subtitle">
                AI Creator Studio
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search articles, authors, genres..." 
                  className="bg-gray-800 text-white px-4 py-2 rounded-full w-80 focus:outline-none focus:ring-2 focus:ring-thoxt-yellow pr-10"
                  data-testid="search-input"
                />
                <Search className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Studio Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Video Recording Area */}
          <div className="flex-1 flex items-center justify-center bg-thoxt-gray p-2 md:p-6" data-testid="video-area">
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
          <div className="hidden md:block">
            <AIToolsSidebar
              onScriptGenerated={setCurrentScript}
            />
          </div>

          {/* Mobile AI Tools - Collapsible */}
          {showAITools && (
            <div className="md:hidden fixed inset-x-0 bottom-0 top-24 bg-thoxt-dark border-t border-gray-800 z-30 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">AI Tools</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAITools(false)}
                    className="text-gray-400"
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
        </div>
      </div>

      {/* Modals */}
      <FiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApplyFilter={setCurrentFilter}
        currentFilter={currentFilter}
      />

      <MusicModal
        isOpen={showMusicModal}
        onClose={() => setShowMusicModal(false)}
        onSelectMusic={setCurrentMusic}
        selectedMusic={currentMusic}
      />

      <TextOverlayModal
        isOpen={showTextModal}
        onClose={() => setShowTextModal(false)}
        onAddOverlay={handleAddTextOverlay}
        currentTime={getCurrentTime()}
      />
    </div>
  );
}