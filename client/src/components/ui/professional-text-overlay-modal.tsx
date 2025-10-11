import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Slider } from "./slider";
import { AlignLeft, AlignCenter, AlignRight, Type, Sparkles } from "lucide-react";

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
  animation?: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'bounce' | 'zoom';
  strokeColor?: string;
  strokeWidth?: number;
  shadow?: boolean;
  glow?: boolean;
  rotation?: number;
}

interface TextOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOverlay: (overlay: TextOverlay) => void;
  currentTime: number;
}

const instagramFonts = [
  { name: "Modern", value: "Arial" },
  { name: "Classic", value: "Times New Roman" },
  { name: "Typewriter", value: "Courier New" },
  { name: "Neon", value: "Impact" },
  { name: "Strong", value: "Arial Black" },
  { name: "Elegant", value: "Georgia" },
  { name: "Clean", value: "Helvetica" },
  { name: "Bold", value: "Verdana" },
  { name: "Casual", value: "Comic Sans MS" },
  { name: "Tech", value: "Consolas" }
];

const textPresets = [
  { id: 'simple', name: 'Simple', style: { color: '#FFFFFF', bg: 'transparent', stroke: false, shadow: false } },
  { id: 'bold', name: 'Bold', style: { color: '#000000', bg: '#FFD700', stroke: false, shadow: true } },
  { id: 'neon', name: 'Neon', style: { color: '#00FF00', bg: 'transparent', stroke: true, shadow: false, glow: true } },
  { id: 'outline', name: 'Outline', style: { color: 'transparent', bg: 'transparent', stroke: true, shadow: false } },
  { id: 'classic', name: 'Classic', style: { color: '#FFFFFF', bg: '#000000', stroke: false, shadow: false } },
  { id: 'instagram', name: 'Instagram', style: { color: '#FFFFFF', bg: 'linear-gradient', stroke: false, shadow: true } }
];

export default function ProfessionalTextOverlayModal({ 
  isOpen, 
  onClose, 
  onAddOverlay, 
  currentTime 
}: TextOverlayModalProps) {
  const [text, setText] = useState("");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState(32);
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [backgroundOpacity, setBackgroundOpacity] = useState(0);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [opacity, setOpacity] = useState(100);
  const [duration, setDuration] = useState(3);
  const [xPosition, setXPosition] = useState(50);
  const [yPosition, setYPosition] = useState(20);
  const [animation, setAnimation] = useState<'none' | 'fade' | 'slide-up' | 'slide-down' | 'bounce' | 'zoom'>('fade');
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(0);
  const [shadow, setShadow] = useState(true);
  const [glow, setGlow] = useState(false);
  const [rotation, setRotation] = useState(0);

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
        backgroundColor: `rgba(${parseInt(backgroundColor.slice(1,3), 16)}, ${parseInt(backgroundColor.slice(3,5), 16)}, ${parseInt(backgroundColor.slice(5,7), 16)}, ${backgroundOpacity / 100})`,
        alignment,
        opacity: opacity / 100,
        startTime: currentTime,
        duration,
        animation,
        strokeColor: strokeWidth > 0 ? strokeColor : undefined,
        strokeWidth: strokeWidth > 0 ? strokeWidth : undefined,
        shadow,
        glow,
        rotation
      };
      
      onAddOverlay(overlay);
      
      // Reset form
      setText("");
      setFontSize(32);
      setOpacity(100);
      setDuration(3);
      setXPosition(50);
      setYPosition(20);
      setAnimation('fade');
      setStrokeWidth(0);
      setShadow(true);
      setGlow(false);
      setRotation(0);
      
      onClose();
    }
  };

  const applyPreset = (preset: typeof textPresets[0]) => {
    setTextColor(preset.style.color);
    if (preset.style.bg !== 'transparent' && preset.style.bg !== 'linear-gradient') {
      setBackgroundColor(preset.style.bg);
      setBackgroundOpacity(80);
    } else {
      setBackgroundOpacity(0);
    }
    setStrokeWidth(preset.style.stroke ? 2 : 0);
    setShadow(preset.style.shadow || false);
    setGlow(preset.style.glow || false);
  };

  const getTextStyle = () => ({
    fontSize: `${fontSize}px`,
    fontFamily,
    color: textColor,
    backgroundColor: `rgba(${parseInt(backgroundColor.slice(1,3), 16)}, ${parseInt(backgroundColor.slice(3,5), 16)}, ${parseInt(backgroundColor.slice(5,7), 16)}, ${backgroundOpacity / 100})`,
    textAlign: alignment as any,
    opacity: opacity / 100,
    padding: '8px 16px',
    borderRadius: '8px',
    transform: `rotate(${rotation}deg)`,
    WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : 'none',
    textShadow: shadow ? '2px 2px 8px rgba(0,0,0,0.8)' : 'none',
    filter: glow ? 'drop-shadow(0 0 10px currentColor)' : 'none',
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-hidden" data-testid="text-overlay-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-thoxt-yellow via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center" data-testid="text-overlay-modal-title">
            <Type className="text-thoxt-yellow mr-2 w-5 h-5" />
            Professional Text Overlay
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Text Input */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block font-semibold">Text Content</label>
            <textarea
              placeholder="Enter your text..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-thoxt-yellow resize-none"
              data-testid="input-text-overlay"
            />
          </div>

          {/* Presets */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block font-semibold">Quick Presets</label>
            <div className="grid grid-cols-3 gap-2">
              {textPresets.map(preset => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                  onClick={() => applyPreset(preset)}
                  data-testid={`preset-${preset.id}`}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Font Settings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300 mb-2 block font-semibold">Font Family</label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="bg-gray-800 text-white border-gray-700" data-testid="select-font-family">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  {instagramFonts.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-gray-300 mb-2 block font-semibold">Font Size: {fontSize}px</label>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                min={16}
                max={120}
                step={2}
                className="mt-2"
                data-testid="slider-font-size"
              />
            </div>
          </div>
          
          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300 mb-2 block font-semibold">Text Color</label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-16 h-10 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                  data-testid="input-text-color"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 bg-gray-800 text-white px-3 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-thoxt-yellow text-xs"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm text-gray-300 mb-2 block font-semibold">Background</label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-16 h-10 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                  data-testid="input-background-color"
                />
                <div className="flex-1">
                  <Slider
                    value={[backgroundOpacity]}
                    onValueChange={(value) => setBackgroundOpacity(value[0])}
                    min={0}
                    max={100}
                    step={5}
                    data-testid="bg-opacity-slider"
                  />
                  <div className="text-xs text-gray-400 mt-1">Opacity: {backgroundOpacity}%</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Text Effects */}
          <div className="space-y-3 bg-gray-800 p-3 rounded-lg">
            <label className="text-sm text-gray-300 font-semibold">Text Effects</label>
            
            {/* Stroke/Outline */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-gray-300">Stroke Width: {strokeWidth}px</label>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="w-8 h-6 bg-gray-700 border border-gray-600 rounded cursor-pointer"
                  data-testid="stroke-color"
                />
              </div>
              <Slider
                value={[strokeWidth]}
                onValueChange={(value) => setStrokeWidth(value[0])}
                min={0}
                max={10}
                step={1}
                data-testid="slider-stroke"
              />
            </div>

            {/* Effects Toggles */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className={`flex-1 ${shadow ? 'bg-thoxt-yellow text-black' : 'bg-gray-700 text-white'}`}
                onClick={() => setShadow(!shadow)}
                data-testid="toggle-shadow"
              >
                Shadow
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`flex-1 ${glow ? 'bg-thoxt-yellow text-black' : 'bg-gray-700 text-white'}`}
                onClick={() => setGlow(!glow)}
                data-testid="toggle-glow"
              >
                Glow
              </Button>
            </div>
          </div>

          {/* Animation */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block font-semibold">Animation</label>
            <Select value={animation} onValueChange={(value: any) => setAnimation(value)}>
              <SelectTrigger className="bg-gray-800 text-white border-gray-700" data-testid="select-animation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white border-gray-700">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="fade">Fade In</SelectItem>
                <SelectItem value="slide-up">Slide Up</SelectItem>
                <SelectItem value="slide-down">Slide Down</SelectItem>
                <SelectItem value="bounce">Bounce</SelectItem>
                <SelectItem value="zoom">Zoom In</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Alignment */}
          <div>
            <label className="text-sm text-gray-300 mb-2 block font-semibold">Text Alignment</label>
            <div className="flex space-x-2" data-testid="alignment-buttons">
              {[
                { value: 'left', icon: AlignLeft },
                { value: 'center', icon: AlignCenter },
                { value: 'right', icon: AlignRight }
              ].map(({ value, icon: Icon }) => (
                <Button
                  key={value}
                  variant="ghost"
                  size="icon"
                  className={`flex-1 ${
                    alignment === value ? 'bg-thoxt-yellow text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                  onClick={() => setAlignment(value as any)}
                  data-testid={`button-align-${value}`}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>
          
          {/* Position & Rotation */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">X Position: {xPosition}%</label>
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
              <label className="text-sm text-gray-300 mb-2 block">Y Position: {yPosition}%</label>
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

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Rotation: {rotation}°</label>
              <Slider
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                min={-180}
                max={180}
                step={5}
                className="mt-2"
                data-testid="slider-rotation"
              />
            </div>
          </div>
          
          {/* Opacity and Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">Opacity: {opacity}%</label>
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
              <label className="text-sm text-gray-300 mb-2 block">Duration: {duration}s</label>
              <Slider
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                min={0.5}
                max={30}
                step={0.5}
                className="mt-2"
                data-testid="slider-duration"
              />
            </div>
          </div>
          
          {/* Live Preview */}
          {text && (
            <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-lg relative border-2 border-gray-700" style={{ minHeight: '150px' }} data-testid="text-preview">
              <div className="absolute top-2 left-2 text-xs text-gray-500 flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Live Preview</span>
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: `${xPosition}%`,
                  top: `${yPosition}%`,
                  fontSize: `${fontSize}px`,
                  fontFamily,
                  color: textColor,
                  backgroundColor: `rgba(${parseInt(backgroundColor.slice(1,3), 16)}, ${parseInt(backgroundColor.slice(3,5), 16)}, ${parseInt(backgroundColor.slice(5,7), 16)}, ${backgroundOpacity / 100})`,
                  textAlign: alignment as any,
                  opacity: opacity / 100,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : 'none',
                  textShadow: shadow ? '2px 2px 8px rgba(0,0,0,0.8)' : 'none',
                  filter: glow ? 'drop-shadow(0 0 10px currentColor)' : 'none',
                  whiteSpace: 'nowrap',
                  maxWidth: '90%',
                  wordBreak: 'break-word'
                }}
              >
                {text}
              </div>
            </div>
          )}
          
          <div className="flex space-x-2 sticky bottom-0 bg-gradient-to-t from-black to-transparent pt-4">
            <Button
              className="flex-1 bg-gradient-to-r from-thoxt-yellow to-yellow-400 text-black font-bold hover:from-yellow-400 hover:to-thoxt-yellow shadow-lg"
              onClick={handleAddText}
              disabled={!text.trim()}
              data-testid="button-add-text"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Add Text Overlay
            </Button>
            
            <Button
              variant="outline"
              className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
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
