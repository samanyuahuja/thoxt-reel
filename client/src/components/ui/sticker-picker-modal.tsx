import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Search, Smile, Heart, Star, Sparkles, Music, Camera, Gift, Sun, Moon } from "lucide-react";

export interface Sticker {
  id: string;
  emoji: string;
  category: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  startTime: number;
  duration: number;
}

interface StickerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSticker: (sticker: Sticker) => void;
  currentTime: number;
}

const stickerCategories = [
  {
    name: "Smileys",
    icon: <Smile className="w-4 h-4" />,
    stickers: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲"]
  },
  {
    name: "Hearts",
    icon: <Heart className="w-4 h-4" />,
    stickers: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "💕", "💞", "💓", "💗", "💖", "💘", "💝"]
  },
  {
    name: "Stars",
    icon: <Star className="w-4 h-4" />,
    stickers: ["⭐", "🌟", "💫", "✨", "🌠", "🎆", "🎇", "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉"]
  },
  {
    name: "Nature",
    icon: <Sun className="w-4 h-4" />,
    stickers: ["🌸", "🌺", "🌻", "🌹", "🌷", "🌼", "🌱", "🌿", "☘️", "🍀", "🌾", "🌵", "🌴", "🌳", "🌲", "☀️", "🌙", "⭐", "🌈", "🌤️", "⛅", "🌦️", "🌧️", "⛈️", "🌩️", "❄️", "☃️", "⛄"]
  },
  {
    name: "Animals",
    icon: <Gift className="w-4 h-4" />,
    stickers: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗"]
  },
  {
    name: "Food",
    icon: <Camera className="w-4 h-4" />,
    stickers: ["🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🥞", "🧇", "🧈", "🍞", "🥐", "🥨", "🥯", "🥖", "🧀", "🥗", "🥙", "🥪", "🌮", "🌯", "🥫"]
  },
  {
    name: "Music",
    icon: <Music className="w-4 h-4" />,
    stickers: ["🎵", "🎶", "🎤", "🎧", "🎸", "🎹", "🎺", "🎷", "🥁", "🎻", "🪕", "🪘", "📻", "🎼", "🎙️"]
  },
  {
    name: "Sparkles",
    icon: <Sparkles className="w-4 h-4" />,
    stickers: ["✨", "💫", "⭐", "🌟", "💥", "💢", "💦", "💨", "🕊️", "🦋", "🌈", "☄️", "🔥", "💎", "👑"]
  }
];

export default function StickerPickerModal({ 
  isOpen, 
  onClose, 
  onAddSticker,
  currentTime 
}: StickerPickerModalProps) {
  const [selectedCategory, setSelectedCategory] = useState(stickerCategories[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stickerSize, setStickerSize] = useState(64);
  const [duration, setDuration] = useState(3);

  const filteredStickers = searchQuery
    ? stickerCategories
        .flatMap(cat => cat.stickers)
        .filter(sticker => 
          sticker.includes(searchQuery) || 
          stickerCategories.some(cat => 
            cat.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            cat.stickers.includes(sticker)
          )
        )
    : selectedCategory.stickers;

  const handleStickerClick = (emoji: string) => {
    const sticker: Sticker = {
      id: `sticker-${Date.now()}-${Math.random()}`,
      emoji,
      category: selectedCategory.name,
      x: 50, // Center position (percentage)
      y: 50,
      size: stickerSize,
      rotation: 0,
      startTime: currentTime,
      duration
    };

    onAddSticker(sticker);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-card to-card/50 backdrop-blur-sm border border-primary/20 text-foreground max-w-2xl max-h-[80vh]" data-testid="sticker-picker-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center" data-testid="sticker-picker-title">
            <Sparkles className="text-primary mr-2 w-5 h-5" />
            Add Stickers & Emojis
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search stickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              data-testid="sticker-search"
            />
          </div>

          {/* Category Tabs */}
          {!searchQuery && (
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin">
              {stickerCategories.map((category) => (
                <Button
                  key={category.name}
                  variant={selectedCategory.name === category.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-1 whitespace-nowrap transition-all ${
                    selectedCategory.name === category.name 
                      ? 'bg-gradient-to-r from-primary to-purple-600 text-white' 
                      : 'border-primary/20 hover:bg-primary/10'
                  }`}
                  data-testid={`category-${category.name.toLowerCase()}`}
                >
                  {category.icon}
                  {category.name}
                </Button>
              ))}
            </div>
          )}

          {/* Sticker Grid */}
          <div className="bg-card/30 rounded-lg p-4 min-h-[250px] max-h-[300px] overflow-y-auto">
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {filteredStickers.map((sticker, index) => (
                <button
                  key={`${sticker}-${index}`}
                  onClick={() => handleStickerClick(sticker)}
                  className="aspect-square flex items-center justify-center text-3xl hover:bg-primary/20 rounded-lg transition-all hover:scale-110 active:scale-95"
                  data-testid={`sticker-${index}`}
                >
                  {sticker}
                </button>
              ))}
            </div>
            
            {filteredStickers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No stickers found
              </div>
            )}
          </div>

          {/* Sticker Settings */}
          <div className="bg-card/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Sticker Size</label>
              <span className="text-sm text-primary">{stickerSize}px</span>
            </div>
            <input
              type="range"
              min="32"
              max="128"
              value={stickerSize}
              onChange={(e) => setStickerSize(Number(e.target.value))}
              className="w-full"
              data-testid="sticker-size-slider"
            />

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Display Duration</label>
              <span className="text-sm text-primary">{duration}s</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full"
              data-testid="sticker-duration-slider"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-primary/20"
              data-testid="cancel-sticker"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
