import { useEffect, useState } from "react";
import { Button } from "./button";
import { X, Edit3 } from "lucide-react";

interface TeleprompterProps {
  isVisible: boolean;
  script: string;
  onClose: () => void;
  isRecording?: boolean;
  recordingTime?: number;
}

export default function Teleprompter({ isVisible, script, onClose, isRecording = false, recordingTime = 0 }: TeleprompterProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    if (script) {
      setWords(script.split(' ').filter(word => word.trim()));
    }
  }, [script]);

  useEffect(() => {
    if (isRecording && isVisible && words.length > 0) {
      // Highlight words based on recording time
      // Assume average reading speed of 150 words per minute (0.4 seconds per word)
      const wordsPerSecond = 150 / 60;
      const expectedWordIndex = Math.floor(recordingTime * wordsPerSecond);
      setCurrentWordIndex(Math.min(expectedWordIndex, words.length - 1));
    } else if (!isRecording) {
      setCurrentWordIndex(0);
    }
  }, [isRecording, recordingTime, words.length, isVisible]);

  useEffect(() => {
    if (!isVisible || !isScrolling) return;

    const interval = setInterval(() => {
      setScrollPosition(prev => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible, isScrolling]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-x-4 top-20 bg-black bg-opacity-70 rounded-lg p-4 z-10" data-testid="teleprompter-overlay">
      <div className="text-white text-center space-y-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-lg font-medium" data-testid="teleprompter-title">AI Generated Script</p>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:text-thoxt-yellow w-6 h-6"
            onClick={onClose}
            data-testid="button-close-teleprompter"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div 
          className="text-sm leading-relaxed max-h-32 overflow-y-auto scrollbar-hide"
          style={{ transform: `translateY(-${scrollPosition}px)` }}
          data-testid="teleprompter-text"
        >
          {script ? (
            <div className="text-left">
              {words.map((word, index) => {
                const isActive = isRecording && index === currentWordIndex;
                const isPast = isRecording && index < currentWordIndex;
                
                return (
                  <span
                    key={index}
                    className={`transition-all duration-300 ${
                      isActive
                        ? 'bg-thoxt-yellow text-black px-1 rounded font-bold scale-110 inline-block'
                        : isPast
                        ? 'text-gray-400'
                        : 'text-white'
                    }`}
                    style={{
                      marginRight: '4px',
                      display: 'inline-block'
                    }}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400">Generate a script using the AI tools to see it here...</p>
          )}
        </div>
        
        <div className="flex justify-center space-x-2 mt-3" data-testid="teleprompter-controls">
          <Button 
            variant="ghost"
            size="sm"
            className="bg-thoxt-yellow text-black px-3 py-1 rounded text-xs hover:bg-yellow-400"
            onClick={onClose}
            data-testid="button-hide-teleprompter"
          >
            Hide
          </Button>
          
          <Button 
            variant="ghost"
            size="sm"
            className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-500"
            data-testid="button-edit-script"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </Button>
          
          <Button 
            variant="ghost"
            size="sm"
            className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-500"
            onClick={() => setIsScrolling(!isScrolling)}
            data-testid="button-toggle-scroll"
          >
            {isScrolling ? 'Pause' : 'Scroll'}
          </Button>
        </div>
      </div>
    </div>
  );
}
