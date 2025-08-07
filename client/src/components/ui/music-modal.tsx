import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Play, Upload, Pause, Volume2, VolumeX, Music } from "lucide-react";
import { Button } from "./button";
import { Slider } from "./slider";

export interface MusicTrack {
  id: string;
  name: string;
  duration: string;
  url: string;
  genre?: string;
  artist?: string;
}

interface MusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: MusicTrack | null) => void;
  currentTrack?: MusicTrack;
}

// Sample music tracks with placeholder URLs (in real app, these would be actual audio URLs)
const predefinedTracks: MusicTrack[] = [
  {
    id: 'track-1',
    name: "Upbeat Corporate",
    duration: "0:30",
    url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    genre: "Corporate",
    artist: "AudioNinja"
  },
  {
    id: 'track-2',
    name: "Inspiring Ambient",
    duration: "0:45",
    url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    genre: "Ambient",
    artist: "SoundScape"
  },
  {
    id: 'track-3',
    name: "Modern Pop Beat",
    duration: "1:00",
    url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    genre: "Pop",
    artist: "BeatMaker"
  },
  {
    id: 'track-4',
    name: "Chill Lounge",
    duration: "0:35",
    url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    genre: "Lounge",
    artist: "ChillVibes"
  },
  {
    id: 'track-5',
    name: "Energetic Rock",
    duration: "0:50",
    url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    genre: "Rock",
    artist: "RockSolid"
  }
];

export default function MusicModal({ isOpen, onClose, onSelectTrack, currentTrack }: MusicModalProps) {
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(currentTrack || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [customTracks, setCustomTracks] = useState<MusicTrack[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTracks = [...predefinedTracks, ...customTracks];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    // Pause audio when modal closes
    if (!isOpen && isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [isOpen, isPlaying]);

  const handleTrackSelect = (track: MusicTrack) => {
    setSelectedTrack(track);
    
    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePlayPause = (track: MusicTrack) => {
    if (audioRef.current) {
      if (isPlaying && selectedTrack?.id === track.id) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // If different track, change source
        if (selectedTrack?.id !== track.id) {
          audioRef.current.src = track.url;
          setSelectedTrack(track);
        }
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      const customTrack: MusicTrack = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        duration: "Unknown",
        url,
        genre: "Custom",
        artist: "Your Upload"
      };
      
      setCustomTracks(prev => [...prev, customTrack]);
      
      // Auto-select the uploaded track
      setSelectedTrack(customTrack);
    }
  };

  const handleApplyMusic = () => {
    onSelectTrack(selectedTrack);
    onClose();
  };

  const handleRemoveMusic = () => {
    onSelectTrack(null);
    setSelectedTrack(null);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-thoxt-gray border-gray-700 text-white w-[500px] max-h-[80vh] overflow-hidden" data-testid="music-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center" data-testid="music-modal-title">
            <Music className="text-thoxt-yellow mr-2 w-5 h-5" />
            Background Music
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Volume Control */}
          <div className="bg-gray-800 p-3 rounded" data-testid="volume-control">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Volume</label>
              <span className="text-sm text-thoxt-yellow">{Math.round(volume * 100)}%</span>
            </div>
            <div className="flex items-center space-x-3">
              <VolumeX className="w-4 h-4 text-gray-400" />
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                min={0}
                max={1}
                step={0.1}
                className="flex-1"
                data-testid="volume-slider"
              />
              <Volume2 className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Music Tracks List */}
          <div className="max-h-64 overflow-y-auto space-y-2" data-testid="music-list">
            {allTracks.map((track) => (
              <div 
                key={track.id}
                className={`flex items-center p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors ${
                  selectedTrack?.id === track.id ? 'ring-2 ring-thoxt-yellow bg-gray-600' : ''
                }`}
                data-testid={`music-track-${track.id}`}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-thoxt-yellow mr-3 hover:bg-thoxt-yellow hover:text-black transition-colors flex-shrink-0"
                  onClick={() => handlePlayPause(track)}
                  data-testid={`play-button-${track.id}`}
                >
                  {isPlaying && selectedTrack?.id === track.id ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </Button>
                
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleTrackSelect(track)}
                >
                  <div className="font-medium" data-testid={`track-name-${track.id}`}>
                    {track.name}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center space-x-2">
                    <span data-testid={`track-duration-${track.id}`}>{track.duration}</span>
                    {track.artist && (
                      <>
                        <span>•</span>
                        <span>{track.artist}</span>
                      </>
                    )}
                    {track.genre && (
                      <>
                        <span>•</span>
                        <span>{track.genre}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {selectedTrack?.id === track.id && (
                  <div className="w-3 h-3 bg-thoxt-yellow rounded-full flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Upload Section */}
          <div className="border-t border-gray-700 pt-4" data-testid="upload-section">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              ref={fileInputRef}
              data-testid="file-input"
            />
            
            <Button
              variant="outline"
              className="w-full flex items-center justify-center p-3 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-upload-music"
            >
              <Upload className="text-thoxt-yellow mr-3 w-5 h-5" />
              <span className="font-medium">Upload Custom Track</span>
            </Button>
            
            <p className="text-xs text-gray-400 mt-2 text-center">
              Supports MP3, WAV, OGG, and M4A files
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2" data-testid="music-actions">
            <Button
              className="flex-1 bg-thoxt-yellow text-black font-medium hover:bg-yellow-400 transition-colors"
              onClick={handleApplyMusic}
              disabled={!selectedTrack}
              data-testid="button-apply-music"
            >
              Apply Music
            </Button>
            
            <Button
              variant="outline"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 transition-colors"
              onClick={handleRemoveMusic}
              data-testid="button-remove-music"
            >
              No Music
            </Button>
            
            <Button
              variant="outline"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 transition-colors"
              onClick={onClose}
              data-testid="button-cancel-music"
            >
              Cancel
            </Button>
          </div>

          {/* Selected Track Info */}
          {selectedTrack && (
            <div className="bg-gray-900 p-3 rounded text-xs text-gray-400" data-testid="selected-track-info">
              <div className="font-medium text-white mb-1">Selected: {selectedTrack.name}</div>
              <div>Duration: {selectedTrack.duration} • {selectedTrack.genre}</div>
            </div>
          )}
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          data-testid="audio-player"
        />
      </DialogContent>
    </Dialog>
  );
}
