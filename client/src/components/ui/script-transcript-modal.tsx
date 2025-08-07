import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Scroll, Play, Pause, RotateCcw, Volume2, VolumeX, BookOpen } from "lucide-react";

interface ScriptTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: string;
}

export default function ScriptTranscriptModal({ isOpen, onClose, script }: ScriptTranscriptModalProps) {
  const [isReading, setIsReading] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(1);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const words = script.split(' ');
  const wordsPerMinute = 150; // Average reading speed

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isReading && currentWordIndex < words.length) {
      const delay = (60 / wordsPerMinute) * 1000 / readingSpeed;
      interval = setInterval(() => {
        setCurrentWordIndex(prev => {
          if (prev >= words.length - 1) {
            setIsReading(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => clearInterval(interval);
  }, [isReading, currentWordIndex, words.length, readingSpeed, wordsPerMinute]);

  const handlePlayPause = () => {
    if (currentWordIndex >= words.length - 1) {
      setCurrentWordIndex(0);
    }
    setIsReading(!isReading);
  };

  const handleReset = () => {
    setIsReading(false);
    setCurrentWordIndex(0);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(script);
      utterance.rate = readingSpeed;
      utterance.volume = speechEnabled ? 1 : 0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getHighlightedScript = () => {
    if (!script) return '';
    
    return words.map((word, index) => {
      const isActive = index === currentWordIndex;
      const isPast = index < currentWordIndex;
      
      let className = 'transition-all duration-300 ';
      if (isActive) {
        className += 'bg-thoxt-yellow text-black px-1 rounded font-semibold scale-110 ';
      } else if (isPast) {
        className += 'text-gray-400 ';
      } else {
        className += 'text-white ';
      }
      
      return (
        <span key={index} className={className}>
          {word}{' '}
        </span>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-thoxt-gray border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-hidden" data-testid="script-transcript-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center" data-testid="script-transcript-title">
            <BookOpen className="text-thoxt-yellow mr-2 w-6 h-6" />
            Script Transcript
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Controls */}
          <div className="flex items-center justify-between bg-gray-800 p-3 rounded" data-testid="transcript-controls">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-thoxt-yellow hover:text-black"
                onClick={handlePlayPause}
                data-testid="button-play-pause"
              >
                {isReading ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-thoxt-yellow hover:text-black"
                onClick={handleReset}
                data-testid="button-reset"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-thoxt-yellow hover:text-black"
                onClick={() => setSpeechEnabled(!speechEnabled)}
                data-testid="button-speech-toggle"
              >
                {speechEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">Speed:</span>
              <select
                value={readingSpeed}
                onChange={(e) => setReadingSpeed(Number(e.target.value))}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                data-testid="select-reading-speed"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
              
              <span className="text-sm text-gray-400">Size:</span>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                data-testid="select-font-size"
              >
                <option value={14}>Small</option>
                <option value={18}>Medium</option>
                <option value={24}>Large</option>
                <option value={32}>Extra Large</option>
              </select>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-700 rounded-full h-2" data-testid="progress-bar">
            <div 
              className="bg-thoxt-yellow h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentWordIndex / words.length) * 100}%` }}
            />
          </div>

          {/* Script Display */}
          <div 
            className="bg-gray-800 p-6 rounded max-h-96 overflow-y-auto leading-relaxed text-justify"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
            data-testid="script-display"
          >
            {script ? (
              <div className="select-text">
                {getHighlightedScript()}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">
                No script available. Generate a script first using the AI tools.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3" data-testid="transcript-actions">
            <Button
              className="flex-1 bg-thoxt-yellow text-black hover:bg-yellow-400 transition-colors"
              onClick={handleSpeak}
              disabled={!script || !speechEnabled}
              data-testid="button-speak-script"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Read Aloud
            </Button>
            
            <Button
              variant="outline"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 transition-colors"
              onClick={() => {
                navigator.clipboard.writeText(script);
              }}
              disabled={!script}
              data-testid="button-copy-script"
            >
              Copy Script
            </Button>
            
            <Button
              variant="outline"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 transition-colors"
              onClick={onClose}
              data-testid="button-close-transcript"
            >
              Close
            </Button>
          </div>

          {/* Statistics */}
          {script && (
            <div className="flex justify-between text-sm text-gray-400 pt-2 border-t border-gray-700" data-testid="script-stats">
              <span>Words: {words.length}</span>
              <span>Est. Reading Time: {Math.ceil(words.length / wordsPerMinute)}m</span>
              <span>Characters: {script.length}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}