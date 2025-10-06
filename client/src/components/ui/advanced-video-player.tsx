import ReactPlayer from 'react-player';
import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface AdvancedVideoPlayerProps {
  url: string | null;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  onEnded?: () => void;
  onProgress?: (state: { played: number; playedSeconds: number }) => void;
}

export function AdvancedVideoPlayer({
  url,
  className = '',
  controls = true,
  autoPlay = false,
  loop = false,
  muted = false,
  onEnded,
  onProgress
}: AdvancedVideoPlayerProps) {
  const [playing, setPlaying] = useState(autoPlay);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(muted);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const playerRef = useRef<any>(null);

  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 rounded-lg ${className}`}>
        <p className="text-gray-400">No video available</p>
      </div>
    );
  }

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
    }
    if (onProgress) {
      onProgress(state);
    }
  };

  const handleSeekChange = (value: number[]) => {
    setPlayed(value[0]);
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (value: number[]) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(value[0]);
    }
  };

  const handleFullscreen = () => {
    const container = document.getElementById('player-container');
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  return (
    <div className={`relative ${className}`} id="player-container">
      <div data-testid="video-player">
        {/* @ts-ignore - ReactPlayer v3 accepts url or src */}
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={playing}
          volume={isMuted ? 0 : volume}
          loop={loop}
          width="100%"
          height="100%"
          onEnded={onEnded}
          onProgress={handleProgress}
        />
      </div>
      
      {controls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress bar */}
          <Slider
            value={[played]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleSeekChange}
            onPointerDown={handleSeekMouseDown}
            onPointerUp={() => handleSeekMouseUp([played])}
            className="mb-3"
            data-testid="slider-progress"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20"
                data-testid="button-play-pause"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              {/* Volume controls */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleToggleMute}
                className="text-white hover:bg-white/20"
                data-testid="button-mute"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-20"
                data-testid="slider-volume"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* Fullscreen button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
                data-testid="button-fullscreen"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
