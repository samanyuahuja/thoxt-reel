import { useState } from "react";
import SidebarNavigation from "@/components/ui/sidebar-navigation";
import VideoRecorder from "@/components/ui/video-recorder";
import AIToolsSidebar from "@/components/ui/ai-tools-sidebar";
import TextOverlayModal, { type TextOverlay } from "@/components/ui/text-overlay-modal";
import FiltersModal, { type VideoFilter } from "@/components/ui/filters-modal";
import MusicModal, { type MusicTrack } from "@/components/ui/music-modal";
import { Search } from "lucide-react";

export default function ReelsCreator() {
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [currentScript, setCurrentScript] = useState("");
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const [currentFilter, setCurrentFilter] = useState<VideoFilter | undefined>();
  const [currentMusic, setCurrentMusic] = useState<MusicTrack | undefined>();

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
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-thoxt-dark border-b border-gray-800 p-4" data-testid="header">
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
                  data-testid="input-search"
                />
                <Search className="absolute right-3 top-3 text-gray-400 w-4 h-4" />
              </div>
              <div className="flex items-center space-x-2" data-testid="auth-links">
                <span className="text-gray-300">Sign Up |</span>
                <span className="text-white">Login</span>
              </div>
            </div>
          </div>
        </header>

        {/* Hashtag Navigation */}
        <div className="bg-thoxt-dark border-b border-gray-800 px-4 py-3" data-testid="hashtag-nav">
          <div className="flex space-x-4 overflow-x-auto">
            <span className="text-thoxt-yellow whitespace-nowrap">#FashionTrends</span>
            <span className="text-gray-300 whitespace-nowrap hover:text-white cursor-pointer">#MovieReview</span>
            <span className="text-gray-300 whitespace-nowrap hover:text-white cursor-pointer">#BreakingNews</span>
            <span className="text-gray-300 whitespace-nowrap hover:text-white cursor-pointer">#Bollywood</span>
            <span className="text-gray-300 whitespace-nowrap hover:text-white cursor-pointer">#RelationshipGoals</span>
            <span className="text-gray-300 whitespace-nowrap hover:text-white cursor-pointer">#OpenAI</span>
            <span className="text-gray-300 whitespace-nowrap hover:text-white cursor-pointer">#GenZ</span>
            <span className="text-gray-300 whitespace-nowrap hover:text-white cursor-pointer">#FilmIndustry</span>
          </div>
        </div>

        {/* Main Reels Interface */}
        <div className="flex-1 flex">
          {/* Reels Creation Area */}
          <div className="flex-1 bg-thoxt-gray">
            <div className="h-full flex items-center justify-center">
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
          </div>

          {/* Right Sidebar - AI Tools & Editor */}
          <AIToolsSidebar onScriptGenerated={setCurrentScript} />
        </div>
      </div>

      {/* Modal Overlays */}
      <FiltersModal 
        isOpen={showFiltersModal} 
        onClose={() => setShowFiltersModal(false)}
        onApplyFilter={setCurrentFilter}
        currentFilter={currentFilter}
      />
      
      <MusicModal 
        isOpen={showMusicModal} 
        onClose={() => setShowMusicModal(false)}
        onSelectTrack={setCurrentMusic}
        currentTrack={currentMusic}
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
