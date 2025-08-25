import { useEffect, useState, useRef } from "react";
import { Button } from "./button";
import { X, Edit3, Play, Pause, RotateCcw, Minus, Plus, Volume2, VolumeX } from "lucide-react";
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

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRecording && isVisible && words.length > 0) {
      // Auto-highlight words based on recording time and speed
      const wordsPerSecond = localSpeed / 60;
      const expectedWordIndex = Math.floor(recordingTime * wordsPerSecond);
      setCurrentWordIndex(Math.min(expectedWordIndex, words.length - 1));
    } else if (!isRecording && isPlaying && words.length > 0) {
      // Manual teleprompter mode
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

  // Auto-scroll to keep current word visible
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
    if (isRecording) return; // Don't allow manual control during recording
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

  // Touch and mouse drag handlers
  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setDragStartY(clientY);
    setIsPlaying(false); // Stop auto-scroll when manually dragging
  };

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;
    const deltaY = clientY - dragStartY;
    setScrollOffset(prev => Math.max(-100, prev - deltaY * 2)); // Increased sensitivity
    setDragStartY(clientY);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Mouse events
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

  // Touch events
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

  // Scroll wheel handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScrollOffset(prev => Math.max(-100, prev + e.deltaY));
    setIsPlaying(false); // Stop auto-scroll when manually scrolling
  };

  const handleSpeakScript = () => {
    if ('speechSynthesis' in window && speechEnabled) {
      window.speechSynthesis.cancel(); // Stop any current speech
      
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.rate = localSpeed / 150; // Normalize to speech rate
      utterance.volume = 1;
      utterance.pitch = 1;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const renderHighlightedScript = () => {
    return words.map((word, index) => {
      const isActive = index === currentWordIndex;
      const isPast = index < currentWordIndex;
      
      let className = 'transition-all duration-300 ';
      if (isActive) {
        className += 'bg-thoxt-yellow text-black px-1 rounded font-semibold scale-110 shadow-lg ';
      } else if (isPast) {
        className += 'text-gray-400 ';
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

  return (
    <div className="absolute inset-x-2 md:inset-x-4 top-16 md:top-20 bg-black bg-opacity-95 rounded-lg p-3 md:p-4 z-20 max-h-[80vh] flex flex-col shadow-2xl border border-gray-700" data-testid="teleprompter-overlay">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <Edit3 className="text-thoxt-yellow w-4 md:w-5 h-4 md:h-5" />
          <h3 className="text-white font-semibold text-base md:text-lg">Teleprompter</h3>
          {isRecording && (
            <span className="text-thoxt-yellow text-xs md:text-sm px-2 py-1 bg-thoxt-yellow bg-opacity-20 rounded animate-pulse">
              Recording
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
      <div className="bg-gray-800 rounded p-2 md:p-3 mb-3 space-y-2 md:space-y-3">
        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!isRecording && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-thoxt-yellow hover:text-black w-8 h-8"
                  onClick={togglePlayPause}
                  data-testid="teleprompter-play-pause"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-thoxt-yellow hover:text-black w-8 h-8"
                  onClick={resetTeleprompter}
                  data-testid="teleprompter-reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-thoxt-yellow hover:text-black w-8 h-8"
                  onClick={() => setSpeechEnabled(!speechEnabled)}
                  data-testid="teleprompter-speech-toggle"
                >
                  {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-thoxt-yellow hover:text-black text-xs px-2"
                  onClick={handleSpeakScript}
                  disabled={!speechEnabled}
                  data-testid="teleprompter-speak"
                >
                  Speak
                </Button>
              </>
            )}
          </div>
          <div className="text-xs text-gray-400">
            Word {currentWordIndex + 1} of {words.length}
          </div>
        </div>

        {/* Speed Control */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-300">Speed (WPM)</label>
            <span className="text-xs text-thoxt-yellow font-mono">{localSpeed}</span>
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
              max={300}
              step={25}
              className="flex-1"
              data-testid="speed-slider"
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700 w-6 h-6 p-0"
              onClick={() => handleSpeedChange(Math.min(300, localSpeed + 25))}
              data-testid="speed-increase"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Font Size Control */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-300">Font Size</label>
            <span className="text-xs text-thoxt-yellow font-mono">{localFontSize}px</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700 w-6 h-6 p-0"
              onClick={() => handleFontSizeChange(Math.max(12, localFontSize - 2))}
              data-testid="font-decrease"
            >
              <Minus className="w-3 h-3" />
            </Button>
            <Slider
              value={[localFontSize]}
              onValueChange={([value]) => handleFontSizeChange(value)}
              min={12}
              max={48}
              step={2}
              className="flex-1"
              data-testid="font-slider"
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-700 w-6 h-6 p-0"
              onClick={() => handleFontSizeChange(Math.min(48, localFontSize + 2))}
              data-testid="font-increase"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Manual Control Hint */}
      {script && (
        <div className="text-center text-xs text-gray-500 mb-2">
          {isDragging ? (
            <span className="text-thoxt-yellow">📱 Manual scroll active</span>
          ) : (
            <span>🖱️ Click & drag, scroll wheel, or touch to manually control</span>
          )}
        </div>
      )}

      {/* Script Display */}
      <div 
        ref={scrollContainerRef}
        className="bg-gray-900 rounded p-3 md:p-4 flex-1 overflow-hidden leading-relaxed text-justify cursor-grab select-none"
        style={{ 
          fontSize: `${localFontSize}px`, 
          lineHeight: 1.6,
          maxHeight: 'calc(80vh - 200px)',
          transform: `translateY(${scrollOffset}px)`,
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
      <div className="mt-3 bg-gray-700 rounded-full h-2" data-testid="progress-bar">
        <div 
          className="bg-thoxt-yellow h-2 rounded-full transition-all duration-300"
          style={{ width: `${words.length > 0 ? (currentWordIndex / words.length) * 100 : 0}%` }}
        />
      </div>

      {/* Statistics */}
      {script && (
        <div className="flex justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700" data-testid="script-stats">
          <span>Words: {words.length}</span>
          <span>Est. Time: {Math.ceil(words.length / localSpeed)}m</span>
          <span>Characters: {script.length}</span>
        </div>
      )}
    </div>
  );
}