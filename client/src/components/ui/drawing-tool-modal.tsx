import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Pencil, Eraser, Palette, Trash2, Undo, Redo, Download } from "lucide-react";

interface DrawingToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoElement?: HTMLVideoElement;
  onSaveDrawing?: (drawingDataUrl: string) => void;
}

interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export default function DrawingToolModal({ 
  isOpen, 
  onClose, 
  videoElement,
  onSaveDrawing 
}: DrawingToolModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#FF0000");
  const [brushWidth, setBrushWidth] = useState(5);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);
  const [redoStack, setRedoStack] = useState<DrawingStroke[]>([]);

  const colors = [
    "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF",
    "#FFFFFF", "#000000", "#FFA500", "#800080", "#FFC0CB", "#A52A2A"
  ];

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 450;

    // Draw video frame as background if available
    if (videoElement) {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Redraw all strokes
    strokes.forEach(stroke => drawStroke(stroke, ctx));
  }, [isOpen, videoElement, strokes]);

  const drawStroke = (stroke: DrawingStroke, ctx: CanvasRenderingContext2D) => {
    if (stroke.points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const point = getCanvasCoordinates(e);
    setIsDrawing(true);
    setCurrentStroke({
      points: [point],
      color: tool === 'eraser' ? '#1a1a1a' : brushColor,
      width: tool === 'eraser' ? brushWidth * 3 : brushWidth
    });
    setRedoStack([]); // Clear redo stack on new action
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();

    const point = getCanvasCoordinates(e);
    const updatedStroke = {
      ...currentStroke,
      points: [...currentStroke.points, point]
    };
    setCurrentStroke(updatedStroke);

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      drawStroke(updatedStroke, ctx);
    }
  };

  const stopDrawing = () => {
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes([...strokes, currentStroke]);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const lastStroke = strokes[strokes.length - 1];
    setRedoStack([...redoStack, lastStroke]);
    setStrokes(strokes.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const strokeToRedo = redoStack[redoStack.length - 1];
    setStrokes([...strokes, strokeToRedo]);
    setRedoStack(redoStack.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
    setRedoStack([]);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      if (videoElement) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSaveDrawing?.(dataUrl);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-primary/20 text-foreground max-w-5xl max-h-[90vh]" data-testid="drawing-tool-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center" data-testid="drawing-tool-title">
            <Pencil className="text-primary mr-2 w-5 h-5" />
            Draw on Video
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Drawing Canvas */}
          <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[500px] cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              data-testid="drawing-canvas"
            />
          </div>

          {/* Tools */}
          <div className="bg-card/30 rounded-lg p-4 space-y-4">
            {/* Tool Selection */}
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={tool === 'pen' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('pen')}
                  className={tool === 'pen' ? 'bg-gradient-to-r from-primary to-purple-600 text-white' : 'border-primary/20'}
                  data-testid="tool-pen"
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Pen
                </Button>
                <Button
                  variant={tool === 'eraser' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('eraser')}
                  className={tool === 'eraser' ? 'bg-gradient-to-r from-primary to-purple-600 text-white' : 'border-primary/20'}
                  data-testid="tool-eraser"
                >
                  <Eraser className="w-4 h-4 mr-1" />
                  Eraser
                </Button>
              </div>

              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={strokes.length === 0}
                  className="border-primary/20"
                  data-testid="undo-button"
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  className="border-primary/20"
                  data-testid="redo-button"
                >
                  <Redo className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="border-primary/20 hover:bg-red-500/10 hover:text-red-500"
                  data-testid="clear-button"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Brush Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Brush Size</label>
                <span className="text-sm text-primary">{brushWidth}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={brushWidth}
                onChange={(e) => setBrushWidth(Number(e.target.value))}
                className="w-full"
                data-testid="brush-size-slider"
              />
            </div>

            {/* Color Palette */}
            {tool === 'pen' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium">Brush Color</label>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        brushColor === color ? 'border-primary scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      data-testid={`color-${color}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-primary/20"
              data-testid="cancel-drawing"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-primary to-purple-600 text-white"
              data-testid="save-drawing"
            >
              <Download className="w-4 h-4 mr-2" />
              Save Drawing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
