import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Slider } from "./slider";
import { AlignLeft, AlignCenter, AlignRight, X } from "lucide-react";

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  alignment: 'left' | 'center' | 'right';
  opacity: number;
  startTime: number;
  duration: number;
}

interface TextOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOverlay: (overlay: TextOverlay) => void;
  currentTime: number;
}

const colors = [
  { name: "Red", value: "bg-red-500" },
  { name: "Yellow", value: "bg-thoxt-yellow" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "White", value: "bg-white" },
];

export default function TextOverlayModal({ isOpen, onClose, onAddOverlay, currentTime }: TextOverlayModalProps) {
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [opacity, setOpacity] = useState(100);
  const [duration, setDuration] = useState(3);
  const [xPosition, setXPosition] = useState(50);
  const [yPosition, setYPosition] = useState(80);

  const handleAddText = () => {
    if (text.trim()) {
      const overlay: TextOverlay = {
        id: Date.now().toString(),
        text: text.trim(),
        x: xPosition,
        y: yPosition,
        fontSize,
        fontFamily,
        color: textColor,
        backgroundColor,
        alignment,
        opacity: opacity / 100,
        startTime: currentTime,
        duration
      };
      
      onAddOverlay(overlay);
      
      // Reset form
      setText("");
      setFontSize(24);
      setOpacity(100);
      setDuration(3);
      setXPosition(50);
      setYPosition(80);
      
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-thoxt-gray border-gray-700 text-white w-96" data-testid="text-overlay-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold" data-testid="text-overlay-modal-title">
            Add Text Overlay
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4 max-h-96 overflow-y-auto">
          {/* Text Input */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Text Content</label>
            <input
              type="text"
              placeholder="Enter your text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-thoxt-yellow"
              data-testid="input-text-overlay"
            />
          </div>
          
          {/* Font Settings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Font Family</label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="bg-gray-800 text-white border-gray-700" data-testid="select-font-family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Font Size: {fontSize}px</label>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={12}
                max={72}
                step={2}
                className="mt-2"
                data-testid="slider-font-size"
              />
            </div>
          </div>
          
          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Text Color</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-full h-10 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                data-testid="input-text-color"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Background</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-10 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                data-testid="input-background-color"
              />
            </div>
          </div>
          
          {/* Alignment */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Text Alignment</label>
            <div className="flex space-x-1" data-testid="alignment-buttons">
              {[
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight }
              ].map(({ value, icon: Icon }) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="icon"
                  className={`bg-gray-800 border border-gray-700 hover:bg-gray-700 ${
                    alignment === value ? 'bg-thoxt-yellow text-black' : 'text-white'
                  }`}
                  onClick={() => setAlignment(value as any)}
                  data-testid={`button-align-${value}`}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>
          
          {/* Position */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">X Position: {xPosition}%</label>
              <Slider
                value={[xPosition]}
                onValueChange={(value) => setXPosition(value[0])}
                min={0}
                max={100}
                step={1}
                className="mt-2"
                data-testid="slider-x-position"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Y Position: {yPosition}%</label>
              <Slider
                value={[yPosition]}
                onValueChange={(value) => setYPosition(value[0])}
                min={0}
                max={100}
                step={1}
                className="mt-2"
                data-testid="slider-y-position"
              />
            </div>
          </div>
          
          {/* Opacity and Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Opacity: {opacity}%</label>
              <Slider
                value={[opacity]}
                onValueChange={(value) => setOpacity(value[0])}
                min={0}
                max={100}
                step={5}
                className="mt-2"
                data-testid="slider-opacity"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Duration: {duration}s</label>
              <Slider
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                min={1}
                max={10}
                step={0.5}
                className="mt-2"
                data-testid="slider-duration"
              />
            </div>
          </div>
          
          {/* Preview */}
          {text && (
            <div className="bg-gray-900 p-4 rounded relative" style={{ minHeight: '100px' }} data-testid="text-preview">
              <div
                style={{
                  position: 'absolute',
                  left: `${xPosition}%`,
                  top: `${yPosition}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${fontSize}px`,
                  fontFamily,
                  color: textColor,
                  backgroundColor,
                  textAlign: alignment,
                  opacity: opacity / 100,
                  padding: '4px 8px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap'
                }}
              >
                {text}
              </div>
              <div className="text-xs text-gray-500 absolute bottom-2 right-2">
                Preview
              </div>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Button
              className="flex-1 bg-thoxt-yellow text-black font-medium hover:bg-yellow-400"
              onClick={handleAddText}
              disabled={!text.trim()}
              data-testid="button-add-text"
            >
              Add Text Overlay
            </Button>
            
            <Button
              variant="outline"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              onClick={onClose}
              data-testid="button-cancel-text"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
