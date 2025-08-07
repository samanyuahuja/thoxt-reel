import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Slider } from "./slider";
import { Sparkles, Palette, Sun, Contrast, Droplets } from "lucide-react";

export interface VideoFilter {
  id: string;
  name: string;
  type: 'css' | 'canvas';
  cssFilter?: string;
  intensity: number;
  icon?: React.ReactNode;
}

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (filter: VideoFilter) => void;
  currentFilter?: VideoFilter;
}

const predefinedFilters: VideoFilter[] = [
  {
    id: 'original',
    name: 'Original',
    type: 'css',
    cssFilter: 'none',
    intensity: 0,
    icon: <Palette className="w-4 h-4" />
  },
  {
    id: 'vintage',
    name: 'Vintage',
    type: 'css', 
    cssFilter: 'sepia(0.8) hue-rotate(-10deg) saturate(1.2)',
    intensity: 80,
    icon: <Sun className="w-4 h-4" />
  },
  {
    id: 'blackwhite',
    name: 'B&W',
    type: 'css',
    cssFilter: 'grayscale(1) contrast(1.1)',
    intensity: 100,
    icon: <Contrast className="w-4 h-4" />
  },
  {
    id: 'warm',
    name: 'Warm',
    type: 'css',
    cssFilter: 'hue-rotate(20deg) saturate(1.3) brightness(1.1)',
    intensity: 75,
    icon: <Sun className="w-4 h-4" />
  },
  {
    id: 'cool',
    name: 'Cool',
    type: 'css',
    cssFilter: 'hue-rotate(-20deg) saturate(1.2) brightness(0.9)',
    intensity: 70,
    icon: <Droplets className="w-4 h-4" />
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    type: 'css',
    cssFilter: 'saturate(2) contrast(1.2) brightness(1.1)',
    intensity: 85,
    icon: <Sparkles className="w-4 h-4" />
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    type: 'css',
    cssFilter: 'contrast(1.5) brightness(0.8) saturate(1.4)',
    intensity: 90,
    icon: <Contrast className="w-4 h-4" />
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    type: 'css',
    cssFilter: 'blur(0.5px) brightness(1.1) contrast(0.9) saturate(1.1)',
    intensity: 60,
    icon: <Sparkles className="w-4 h-4" />
  }
];

export default function FiltersModal({ isOpen, onClose, onApplyFilter, currentFilter }: FiltersModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<VideoFilter | null>(currentFilter || null);
  const [customIntensity, setCustomIntensity] = useState(currentFilter?.intensity || 50);

  const handleFilterSelect = (filter: VideoFilter) => {
    setSelectedFilter(filter);
    setCustomIntensity(filter.intensity);
  };

  const handleApplyFilter = () => {
    if (selectedFilter) {
      const filterWithCustomIntensity = {
        ...selectedFilter,
        intensity: customIntensity,
        cssFilter: adjustFilterIntensity(selectedFilter.cssFilter || 'none', customIntensity, selectedFilter.intensity)
      };
      onApplyFilter(filterWithCustomIntensity);
      onClose();
    }
  };

  const adjustFilterIntensity = (originalFilter: string, newIntensity: number, originalIntensity: number): string => {
    if (originalFilter === 'none') return 'none';
    
    // Calculate intensity multiplier
    const multiplier = newIntensity / originalIntensity;
    
    // Adjust filter values based on intensity
    return originalFilter
      .replace(/sepia\((\d*\.?\d+)\)/g, (match, value) => `sepia(${Math.min(1, parseFloat(value) * multiplier)})`)
      .replace(/grayscale\((\d*\.?\d+)\)/g, (match, value) => `grayscale(${Math.min(1, parseFloat(value) * multiplier)})`)
      .replace(/saturate\((\d*\.?\d+)\)/g, (match, value) => `saturate(${Math.max(0.1, parseFloat(value) * multiplier)})`)
      .replace(/contrast\((\d*\.?\d+)\)/g, (match, value) => `contrast(${Math.max(0.1, parseFloat(value) * multiplier)})`)
      .replace(/brightness\((\d*\.?\d+)\)/g, (match, value) => `brightness(${Math.max(0.1, parseFloat(value) * multiplier)})`)
      .replace(/blur\((\d*\.?\d+)px\)/g, (match, value) => `blur(${Math.max(0, parseFloat(value) * multiplier)}px)`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-thoxt-gray border-gray-700 text-white w-[480px] max-h-[80vh] overflow-y-auto" data-testid="filters-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center" data-testid="filters-modal-title">
            <Sparkles className="text-thoxt-yellow mr-2 w-5 h-5" />
            Video Effects & Filters
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Filter Grid */}
          <div className="grid grid-cols-2 gap-3" data-testid="filters-grid">
            {predefinedFilters.map((filter) => (
              <div 
                key={filter.id}
                className={`relative p-3 bg-gray-700 rounded cursor-pointer transition-all group hover:bg-gray-600 ${
                  selectedFilter?.id === filter.id ? 'ring-2 ring-thoxt-yellow bg-gray-600' : ''
                }`}
                onClick={() => handleFilterSelect(filter)}
                data-testid={`filter-${filter.id}`}
              >
                <div className="flex items-center space-x-2">
                  <div className="text-thoxt-yellow">
                    {filter.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm" data-testid={`filter-name-${filter.id}`}>
                      {filter.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {filter.intensity}% intensity
                    </div>
                  </div>
                </div>
                
                {/* Preview Box */}
                <div 
                  className="w-full h-16 mt-2 rounded bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all"
                  style={{ filter: filter.cssFilter }}
                  data-testid={`filter-preview-${filter.id}`}
                />
                
                {selectedFilter?.id === filter.id && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-thoxt-yellow rounded-full" />
                )}
              </div>
            ))}
          </div>

          {/* Custom Intensity Control */}
          {selectedFilter && selectedFilter.id !== 'original' && (
            <div className="bg-gray-800 p-4 rounded" data-testid="intensity-control">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-300">
                  Filter Intensity
                </label>
                <span className="text-sm text-thoxt-yellow font-medium">
                  {customIntensity}%
                </span>
              </div>
              <Slider
                value={[customIntensity]}
                onValueChange={(value) => setCustomIntensity(value[0])}
                min={0}
                max={150}
                step={5}
                className="mb-3"
                data-testid="slider-intensity"
              />
              
              {/* Live Preview */}
              <div className="text-xs text-gray-400 mb-2">Live Preview:</div>
              <div 
                className="w-full h-12 rounded bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                style={{ 
                  filter: adjustFilterIntensity(
                    selectedFilter.cssFilter || 'none', 
                    customIntensity, 
                    selectedFilter.intensity
                  ) 
                }}
                data-testid="live-preview"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2" data-testid="filter-actions">
            <Button
              className="flex-1 bg-thoxt-yellow text-black font-medium hover:bg-yellow-400 transition-colors"
              onClick={handleApplyFilter}
              disabled={!selectedFilter}
              data-testid="button-apply-filter"
            >
              Apply Filter
            </Button>
            
            <Button
              variant="outline"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 transition-colors"
              onClick={() => {
                setSelectedFilter(predefinedFilters[0]); // Reset to Original
                setCustomIntensity(0);
              }}
              data-testid="button-reset-filter"
            >
              Reset
            </Button>
            
            <Button
              variant="outline"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 transition-colors"
              onClick={onClose}
              data-testid="button-cancel-filter"
            >
              Cancel
            </Button>
          </div>

          {/* Filter Info */}
          {selectedFilter && (
            <div className="bg-gray-900 p-3 rounded text-xs text-gray-400" data-testid="filter-info">
              <div className="font-medium text-white mb-1">Current Filter: {selectedFilter.name}</div>
              <div>CSS Filter: {selectedFilter.cssFilter}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}