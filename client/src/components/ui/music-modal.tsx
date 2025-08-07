import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Play, Upload } from "lucide-react";
import { Button } from "./button";

interface MusicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const musicTracks = [
  { name: "Upbeat Corporate", duration: "0:30" },
  { name: "Inspiring Ambient", duration: "0:45" },
  { name: "Modern Pop Beat", duration: "1:00" },
  { name: "Chill Lounge", duration: "0:35" },
  { name: "Energetic Rock", duration: "0:50" },
];

export default function MusicModal({ isOpen, onClose }: MusicModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-thoxt-gray border-gray-700 text-white w-96 max-h-96 overflow-y-auto" data-testid="music-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold" data-testid="music-modal-title">
            Background Music
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4" data-testid="music-list">
          {musicTracks.map((track, index) => (
            <div 
              key={index}
              className="flex items-center p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition-colors"
              data-testid={`music-track-${index}`}
            >
              <Play className="text-thoxt-yellow mr-3 w-5 h-5" />
              <div className="flex-1">
                <div className="font-medium" data-testid={`track-name-${index}`}>{track.name}</div>
                <div className="text-xs text-gray-400" data-testid={`track-duration-${index}`}>{track.duration}</div>
              </div>
            </div>
          ))}
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-center p-3 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 transition-colors"
            data-testid="button-upload-music"
          >
            <Upload className="text-thoxt-yellow mr-3 w-5 h-5" />
            <div className="font-medium">Upload Custom Track</div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
