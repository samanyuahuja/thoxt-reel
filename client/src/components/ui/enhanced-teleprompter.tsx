import { useEffect, useState, useRef } from "react";
import { Button } from "./button";
import { X, Edit3, Play, Pause, RotateCcw, Minus, Plus, Volume2, VolumeX, Eye, EyeOff, Maximize2, Minimize2 } from "lucide-react";
import { Slider } from "./slider";

interface TeleprompterProps {
  isVisible: boolean;
  script: string;
  onClose: () => void;
  isRecording?: boolean;
  recordingTime?: number;
  speed?: number;
  fontSize?: number;
  onSpeedChange?: (speed: number) => void;
  onFontSizeChange?: (fontSize: number) => void;
}

export default function EnhancedTeleprompter({ 
  isVisible, 
  script, 
  onClose, 
  isRecording = false, 
  recordingTime = 0,
  speed = 150,
  fontSize = 24,
  onSpeedChange,
  onFontSizeChange
}: TeleprompterProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [localSpeed, setLocalSpeed] = useState(speed);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [backgroundOpacity, setBackgroundOpacity] = useState(95);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlightStyle, setHighlightStyle] = useState<'box' | 'underline' | 'glow'>('box');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    if (script) {
      setWords(script.split(' ').filter(word => word.trim()));
      setCurrentWordIndex(0);
    }
  }, [script]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isVisible) return;
      
      switch(e.key) {
        case ' ':
          e.preventDefault();
          if (!isRecording) togglePlayPause();
          break;
        case 'ArrowUp':
          e.preventDefault();
          setScrollOffset(prev => prev - 50);
          setIsPlaying(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setScrollOffset(prev => prev + 50);
          setIsPlaying(false);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentWordIndex(prev => Math.max(0, prev - 5));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentWordIndex(prev => Math.min(words.length - 1, prev + 5));
          break;
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetTeleprompter();
          }
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsFullscreen(!isFullscreen);
          }
          break;
        case 'm':
        case 'M':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setMirrorMode(!mirrorMode);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible, isRecording, isPlaying, words.length, isFullscreen, mirrorMode]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRecording && isVisible && words.length > 0) {
      const wordsPerSecond = localSpeed / 60;
      const expectedWordIndex = Math.floor(recordingTime * wordsPerSecond);
      setCurrentWordIndex(Math.min(expectedWordIndex, words.length - 1));
    } else if (!isRecording && isPlaying && words.length > 0) {
      const millisecondsPerWord = (60 / localSpeed) * 1000;
      
      intervalRef.current = setInterval(() => {
        setCurrentWordIndex(prev => {
          if (prev >= words.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, millisecondsPerWord);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRecording, recordingTime, words.length, isVisible, isPlaying, localSpeed]);

  useEffect(() => {
    if (scrollContainerRef.current && currentWordIndex > 0) {
      const container = scrollContainerRef.current;
      const activeElement = container.querySelector(`[data-word-index="${currentWordIndex}"]`);
      
      if (activeElement) {
        activeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [currentWordIndex]);

  const handleSpeedChange = (newSpeed: number) => {
    setLocalSpeed(newSpeed);
    onSpeedChange?.(newSpeed);
  };

  const handleFontSizeChange = (newSize: number) => {
    setLocalFontSize(newSize);
    onFontSizeChange?.(newSize);
  };

  const togglePlayPause = () => {
    if (isRecording) return;
    setIsPlaying(!isPlaying);
  };

  const resetTeleprompter = () => {
    setCurrentWordIndex(0);
    setIsPlaying(false);
    setScrollOffset(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setDragStartY(clientY);
    setIsPlaying(false);
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    const deltaY = clientY - dragStartY;
    setScrollOffset(prev => Math.max(-100, prev - deltaY * 2));
    setDragStartY(clientY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleDragMove(e.clientY);
    }
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDragMove(touch.clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScrollOffset(prev => Math.max(-100, prev + e.deltaY));
    setIsPlaying(false);
  };

  const handleSpeakScript = () => {
    if ('speechSynthesis' in window && speechEnabled) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.rate = localSpeed / 150;
      utterance.volume = 1;
      utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const renderHighlightedScript = () => {
    return words.map((word, index) => {
      const isActive = index === currentWordIndex;
      const isPast = index < currentWordIndex;
      
      let className = 'transition-all duration-300 inline-block mx-0.5 ';
      
      if (isActive) {
        if (highlightStyle === 'box') {
          className += 'bg-thoxt-yellow text-black px-2 py-0.5 rounded-md font-bold scale-110 shadow-xl ';
        } else if (highlightStyle === 'underline') {
          className += 'text-thoxt-yellow font-bold scale-110 border-b-4 border-thoxt-yellow pb-1 ';
        } else {
          className += 'text-thoxt-yellow font-bold scale-110 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)] ';
        }
      } else if (isPast) {
        className += 'text-gray-500 opacity-60 ';
      } else {
        className += 'text-white ';
      }
      
      return (
        <span 
          key={index} 
          className={className}
          data-word-index={index}
        >
          {word}{' '}
        </span>
      );
    });
  };

  if (!isVisible) return null;

  const containerClasses = isFullscreen 
    ? "fixed inset-0 bg-black z-50 flex flex-col" 
    : "absolute inset-x-2 md:inset-x-4 top-16 md:top-20 rounded-lg z-20 max-h-[80vh] flex flex-col shadow-2xl border border-gray-700";

  return (
    <div 
      className={containerClasses}
      style={{ 
        backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity / 100})`,
        transform: mirrorMode ? 'scaleX(-1)' : 'none'
      }} 
      data-testid="teleprompter-overlay"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-3 md:p-4 border-b border-gray-700" style={{ transform: mirrorMode ? 'scaleX(-1)' : 'none' }}>
        <div className="flex items-center space-x-2">
          <Edit3 className="text-thoxt-yellow w-4 md:w-5 h-4 md:h-5" />
          <h3 className="text-white font-semibold text-base md:text-lg">Professional Teleprompter</h3>
          {isRecording && (
            <span className="text-thoxt-yellow text-xs md:text-sm px-2 py-1 bg-thoxt-yellow bg-opacity-20 rounded animate-pulse">
              🔴 REC
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-gray-700 w-8 h-8 md:w-10 md:h-10"
          onClick={onClose}
          data-testid="close-teleprompter"
        >
          <X className="w-4 md:w-5 h-4 md:h-5" />
        </Button>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded m-2 md:m-3 p-2 md:p-3 space-y-2 md:space-y-3" style={{ transform: mirrorMode ? 'scaleX(-1)' : 'none' }}>
        {/* Row 1: Playback & View Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1">
            {!isRecording && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-thoxt-yellow hover:text-black w-8 h-8"
                  onClick={togglePlayPause}
                  data-testid="teleprompter-play-pause"
                  title="Space"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-thoxt-yellow hover:text-black w-8 h-8"
                  onClick={resetTeleprompter}
                  data-testid="teleprompter-reset"
                  title="Ctrl+R"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className={`w-8 h-8 ${mirrorMode ? 'bg-thoxt-yellow text-black' : 'text-white hover:bg-gray-700'}`}
              onClick={() => setMirrorMode(!mirrorMode)}
              data-testid="mirror-toggle"
              title="Ctrl+M - Mirror Mode"
            >
              {mirrorMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`w-8 h-8 ${isFullscreen ? 'bg-thoxt-yellow text-black' : 'text-white hover:bg-gray-700'}`}
              onClick={() => setIsFullscreen(!isFullscreen)}
              data-testid="fullscreen-toggle"
              title="Ctrl+F - Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`w-8 h-8 ${speechEnabled ? 'text-thoxt-yellow' : 'text-gray-500'}`}
              onClick={() => setSpeechEnabled(!speechEnabled)}
              data-testid="teleprompter-speech-toggle"
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Row 2: Speed Control */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-300">Speed (WPM)</label>
            <span className="text-xs text-thoxt-yellow font-mono font-bold">{localSpeed}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700 w-6 h-6 p-0"
              onClick={() => handleSpeedChange(Math.max(50, localSpeed - 25))}
              data-testid="speed-decrease"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Slider
              value={[localSpeed]}
              onValueChange={([value]) => handleSpeedChange(value)}
              min={50}
              max={400}
              step={25}
              className="flex-1"
              data-testid="speed-slider"
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700 w-6 h-6 p-0"
              onClick={() => handleSpeedChange(Math.min(400, localSpeed + 25))}
              data-testid="speed-increase"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Row 3: Font Size & Background */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-300">Font Size</label>
              <span className="text-xs text-thoxt-yellow font-mono">{localFontSize}px</span>
            </div>
            <Slider
              value={[localFontSize]}
              onValueChange={([value]) => handleFontSizeChange(value)}
              min={16}
              max={72}
              step={2}
              className="mt-1"
              data-testid="font-slider"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-300">Background</label>
              <span className="text-xs text-thoxt-yellow font-mono">{backgroundOpacity}%</span>
            </div>
            <Slider
              value={[backgroundOpacity]}
              onValueChange={([value]) => setBackgroundOpacity(value)}
              min={0}
              max={100}
              step={5}
              className="mt-1"
              data-testid="opacity-slider"
            />
          </div>
        </div>

        {/* Row 4: Highlight Style */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-300">Highlight Style</label>
          <div className="flex space-x-1">
            {(['box', 'underline', 'glow'] as const).map((style) => (
              <Button
                key={style}
                variant="ghost"
                size="sm"
                className={`text-xs px-2 h-6 ${highlightStyle === style ? 'bg-thoxt-yellow text-black' : 'text-white hover:bg-gray-700'}`}
                onClick={() => setHighlightStyle(style)}
                data-testid={`highlight-${style}`}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      {script && (
        <div className="text-center text-xs text-gray-500 px-3 pb-1" style={{ transform: mirrorMode ? 'scaleX(-1)' : 'none' }}>
          {isDragging ? (
            <span className="text-thoxt-yellow font-medium">📱 Manual scroll active</span>
          ) : (
            <span>⌨️ Space: Play/Pause • ↑↓: Scroll • ←→: Skip • Ctrl+M: Mirror • Ctrl+F: Fullscreen</span>
          )}
        </div>
      )}

      {/* Script Display */}
      <div 
        ref={scrollContainerRef}
        className="bg-gradient-to-b from-gray-900 to-black rounded mx-2 md:mx-3 mb-2 md:mb-3 p-4 md:p-6 flex-1 overflow-hidden leading-loose text-center cursor-grab select-none"
        style={{ 
          fontSize: `${localFontSize}px`, 
          lineHeight: 1.8,
          maxHeight: isFullscreen ? 'calc(100vh - 250px)' : 'calc(80vh - 250px)',
          transform: `translateY(${scrollOffset}px) ${mirrorMode ? 'scaleX(-1)' : ''}`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        data-testid="script-display"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {script ? (
          <div className="select-text">
            {renderHighlightedScript()}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">
            No script available. Generate a script using AI tools or paste your content.
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mx-2 md:mx-3 mb-2 bg-gray-700 rounded-full h-3 relative overflow-hidden" data-testid="progress-bar" style={{ transform: mirrorMode ? 'scaleX(-1)' : 'none' }}>
        <div 
          className="bg-gradient-to-r from-thoxt-yellow via-yellow-400 to-thoxt-yellow h-3 rounded-full transition-all duration-300 shadow-lg shadow-thoxt-yellow/50"
          style={{ width: `${words.length > 0 ? (currentWordIndex / words.length) * 100 : 0}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      </div>

      {/* Statistics */}
      {script && (
        <div className="flex justify-between text-xs text-gray-400 mx-2 md:mx-3 mb-2 md:mb-3 pb-2 pt-1 border-t border-gray-700" data-testid="script-stats" style={{ transform: mirrorMode ? 'scaleX(-1)' : 'none' }}>
          <span>📝 {words.length} words</span>
          <span>⏱️ {Math.ceil(words.length / localSpeed)}m {Math.round((words.length / localSpeed * 60) % 60)}s</span>
          <span>📊 {currentWordIndex + 1}/{words.length}</span>
          <span>🔤 {script.length} chars</span>
        </div>
      )}
    </div>
  );
}
