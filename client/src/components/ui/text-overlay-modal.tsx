import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface TextOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const colors = [
  { name: "Red", value: "bg-red-500" },
  { name: "Yellow", value: "bg-thoxt-yellow" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "White", value: "bg-white" },
];

export default function TextOverlayModal({ isOpen, onClose }: TextOverlayModalProps) {
  const [text, setText] = useState("");
  const [fontStyle, setFontStyle] = useState("normal");
  const [selectedColor, setSelectedColor] = useState("bg-thoxt-yellow");

  const handleAddText = () => {
    if (text.trim()) {
      // TODO: Add text overlay to video
      console.log("Adding text overlay:", { text, fontStyle, selectedColor });
      setText("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-thoxt-gray border-gray-700 text-white w-96" data-testid="text-overlay-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold" data-testid="text-overlay-modal-title">
            Add Text
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <input
            type="text"
            placeholder="Enter your text..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-thoxt-yellow"
            data-testid="input-text-overlay"
          />
          
          <div className="flex space-x-2" data-testid="text-styling-controls">
            <Select value={fontStyle} onValueChange={setFontStyle}>
              <SelectTrigger className="flex-1 bg-gray-800 text-white border-gray-700" data-testid="select-font-style">
                <SelectValue placeholder="Font Style" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white border-gray-700">
                <SelectItem value="normal" data-testid="option-font-normal">Normal</SelectItem>
                <SelectItem value="bold" data-testid="option-font-bold">Bold</SelectItem>
                <SelectItem value="script" data-testid="option-font-script">Script</SelectItem>
                <SelectItem value="sans" data-testid="option-font-sans">Sans Serif</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex space-x-1" data-testid="color-picker">
              {colors.map((color, index) => (
                <button
                  key={index}
                  className={`w-8 h-8 rounded ${color.value} ${
                    selectedColor === color.value ? 'ring-2 ring-white' : ''
                  }`}
                  onClick={() => setSelectedColor(color.value)}
                  data-testid={`color-${color.name.toLowerCase()}`}
                />
              ))}
            </div>
          </div>
          
          <Button
            className="w-full bg-thoxt-yellow text-black font-medium hover:bg-yellow-400"
            onClick={handleAddText}
            disabled={!text.trim()}
            data-testid="button-add-text"
          >
            Add Text
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
