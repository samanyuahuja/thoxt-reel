import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Slider } from "./slider";
import { Sparkles, Sun, Moon, Zap, Droplets, Flame, Wind, Star, Heart, Camera } from "lucide-react";

export interface VideoFilter {
  id: string;
  name: string;
  type: 'css' | 'canvas';
  cssFilter?: string;
  intensity: number;
  icon?: React.ReactNode;
  category: 'instagram' | 'vintage' | 'modern' | 'artistic';
}

interface AdvancedControls {
  highlights: number;
  shadows: number;
  temperature: number;
  tint: number;
  vignette: number;
  grain: number;
}

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (filter: VideoFilter, advanced?: AdvancedControls) => void;
  currentFilter?: VideoFilter;
}

const instagramFilters: VideoFilter[] = [
  {
    id: 'original',
    name: 'Original',
    type: 'css',
    cssFilter: 'none',
    intensity: 0,
    icon: <Camera className="w-4 h-4" />,
    category: 'instagram'
  },
  {
    id: 'clarendon',
    name: 'Clarendon',
    type: 'css',
    cssFilter: 'contrast(1.2) saturate(1.35)',
    intensity: 100,
    icon: <Sun className="w-4 h-4" />,
    category: 'instagram'
  },
  {
    id: 'gingham',
    name: 'Gingham',
    type: 'css',
    cssFilter: 'brightness(1.05) hue-rotate(-10deg)',
    intensity: 85,
    icon: <Heart className="w-4 h-4" />,
    category: 'instagram'
  },
  {
    id: 'juno',
    name: 'Juno',
    type: 'css',
    cssFilter: 'sepia(0.35) contrast(1.15) brightness(1.15) saturate(1.8)',
    intensity: 95,
    icon: <Flame className="w-4 h-4" />,
    category: 'instagram'
  },
  {
    id: 'lark',
    name: 'Lark',
    type: 'css',
    cssFilter: 'brightness(1.1) contrast(0.9) saturate(1.3)',
    intensity: 90,
    icon: <Star className="w-4 h-4" />,
    category: 'instagram'
  },
  {
    id: 'ludwig',
    name: 'Ludwig',
    type: 'css',
    cssFilter: 'brightness(1.05) contrast(1.1) saturate(1.3)',
    intensity: 100,
    icon: <Zap className="w-4 h-4" />,
    category: 'instagram'
  },
  {
    id: 'valencia',
    name: 'Valencia',
    type: 'css',
    cssFilter: 'sepia(0.25) brightness(1.1) contrast(1.1)',
    intensity: 85,
    icon: <Sun className="w-4 h-4" />,
    category: 'instagram'
  },
  {
    id: 'moon',
    name: 'Moon',
    type: 'css',
    cssFilter: 'grayscale(1) contrast(1.1) brightness(1.1)',
    intensity: 100,
    icon: <Moon className="w-4 h-4" />,
    category: 'instagram'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    type: 'css',
    cssFilter: 'sepia(0.8) hue-rotate(-10deg) saturate(1.2)',
    intensity: 80,
    icon: <Camera className="w-4 h-4" />,
    category: 'vintage'
  },
  {
    id: 'nashville',
    name: 'Nashville',
    type: 'css',
    cssFilter: 'sepia(0.4) contrast(1.2) brightness(1.05) saturate(1.2)',
    intensity: 90,
    icon: <Star className="w-4 h-4" />,
    category: 'vintage'
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    type: 'css',
    cssFilter: 'hue-rotate(180deg) saturate(1.5) brightness(0.95)',
    intensity: 85,
    icon: <Droplets className="w-4 h-4" />,
    category: 'modern'
  },
  {
    id: 'arctic',
    name: 'Arctic',
    type: 'css',
    cssFilter: 'hue-rotate(200deg) saturate(0.7) brightness(1.2)',
    intensity: 80,
    icon: <Wind className="w-4 h-4" />,
    category: 'modern'
  }
];

export default function InstagramFiltersModal({ 
  isOpen, 
  onClose, 
  onApplyFilter, 
  currentFilter 
}: FiltersModalProps) {
  const [selectedFilter, setSelectedFilter] = useState<VideoFilter | null>(currentFilter || null);
  const [customIntensity, setCustomIntensity] = useState(currentFilter?.intensity || 50);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const [advancedControls, setAdvancedControls] = useState<AdvancedControls>({
    highlights: 0,
    shadows: 0,
    temperature: 0,
    tint: 0,
    vignette: 0,
    grain: 0
  });

  const filteredFilters = selectedCategory === 'all' 
    ? instagramFilters 
    : instagramFilters.filter(f => f.category === selectedCategory);

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
      onApplyFilter(filterWithCustomIntensity, showAdvanced ? advancedControls : undefined);
      onClose();
    }
  };

  const adjustFilterIntensity = (originalFilter: string, newIntensity: number, originalIntensity: number): string => {
    if (originalFilter === 'none') return 'none';
    
    const multiplier = newIntensity / originalIntensity;
    
    return originalFilter
      .replace(/sepia\((\d*\.?\d+)\)/g, (match, value) => `sepia(${Math.min(1, parseFloat(value) * multiplier)})`)
      .replace(/grayscale\((\d*\.?\d+)\)/g, (match, value) => `grayscale(${Math.min(1, parseFloat(value) * multiplier)})`)
      .replace(/saturate\((\d*\.?\d+)\)/g, (match, value) => `saturate(${Math.max(0.1, parseFloat(value) * multiplier)})`)
      .replace(/contrast\((\d*\.?\d+)\)/g, (match, value) => `contrast(${Math.max(0.1, parseFloat(value) * multiplier)})`)
      .replace(/brightness\((\d*\.?\d+)\)/g, (match, value) => `brightness(${Math.max(0.1, parseFloat(value) * multiplier)})`)
      .replace(/blur\((\d*\.?\d+)px\)/g, (match, value) => `blur(${Math.max(0, parseFloat(value) * multiplier)}px)`);
  };

  const buildAdvancedFilter = (): string => {
    const filters = [];
    
    if (advancedControls.highlights !== 0) {
      const val = 1 + advancedControls.highlights / 100;
      filters.push(`brightness(${val})`);
    }
    if (advancedControls.shadows !== 0) {
      const val = 1 + advancedControls.shadows / 100;
      filters.push(`contrast(${val})`);
    }
    if (advancedControls.temperature !== 0) {
      filters.push(`hue-rotate(${advancedControls.temperature}deg)`);
    }
    if (advancedControls.tint !== 0) {
      const val = 1 + advancedControls.tint / 100;
      filters.push(`saturate(${val})`);
    }
    if (advancedControls.vignette > 0) {
      filters.push(`brightness(${1 - advancedControls.vignette / 200})`);
    }
    
    return filters.join(' ');
  };

  const categories = [
    { id: 'all', name: 'All', icon: <Sparkles className="w-3 h-3" /> },
    { id: 'instagram', name: 'Instagram', icon: <Heart className="w-3 h-3" /> },
    { id: 'vintage', name: 'Vintage', icon: <Camera className="w-3 h-3" /> },
    { id: 'modern', name: 'Modern', icon: <Zap className="w-3 h-3" /> },
    { id: 'artistic', name: 'Artistic', icon: <Star className="w-3 h-3" /> }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-gray-900 to-black border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-hidden" data-testid="filters-modal">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-thoxt-yellow via-yellow-400 to-thoxt-yellow bg-clip-text text-transparent flex items-center" data-testid="filters-modal-title">
            <Sparkles className="text-thoxt-yellow mr-2 w-5 h-5" />
            Professional Filters & Effects
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Category Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2" data-testid="filter-categories">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant="ghost"
                size="sm"
                className={`flex items-center space-x-1 whitespace-nowrap ${
                  selectedCategory === cat.id 
                    ? 'bg-thoxt-yellow text-black font-bold' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => setSelectedCategory(cat.id)}
                data-testid={`category-${cat.id}`}
              >
                {cat.icon}
                <span>{cat.name}</span>
              </Button>
            ))}
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" data-testid="filters-grid">
            {filteredFilters.map((filter) => (
              <div 
                key={filter.id}
                className={`group relative p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                  selectedFilter?.id === filter.id ? 'ring-2 ring-thoxt-yellow shadow-lg shadow-thoxt-yellow/50' : ''
                }`}
                onClick={() => handleFilterSelect(filter)}
                data-testid={`filter-${filter.id}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className="text-thoxt-yellow">
                    {filter.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm" data-testid={`filter-name-${filter.id}`}>
                      {filter.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {filter.intensity}%
                    </div>
                  </div>
                </div>
                
                {/* Preview Box */}
                <div 
                  className="w-full h-20 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all overflow-hidden"
                  style={{ filter: filter.cssFilter }}
                  data-testid={`filter-preview-${filter.id}`}
                >
                  <div className="w-full h-full opacity-80 bg-[url('/api/placeholder/200/100')] bg-cover" />
                </div>
                
                {selectedFilter?.id === filter.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-thoxt-yellow rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Compare Mode Toggle */}
          <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
            <span className="text-sm font-medium">Before/After Comparison</span>
            <Button
              variant="ghost"
              size="sm"
              className={compareMode ? 'bg-thoxt-yellow text-black' : 'text-white'}
              onClick={() => setCompareMode(!compareMode)}
              data-testid="compare-toggle"
            >
              {compareMode ? 'Split View ON' : 'Split View OFF'}
            </Button>
          </div>

          {/* Custom Intensity Control */}
          {selectedFilter && selectedFilter.id !== 'original' && (
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 rounded-lg" data-testid="intensity-control">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-200">
                  Filter Intensity
                </label>
                <span className="text-sm text-thoxt-yellow font-bold px-3 py-1 bg-gray-700 rounded-full">
                  {customIntensity}%
                </span>
              </div>
              <Slider
                value={[customIntensity]}
                onValueChange={(value) => setCustomIntensity(value[0])}
                min={0}
                max={200}
                step={5}
                className="mb-4"
                data-testid="slider-intensity"
              />
              
              {/* Live Preview */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-2">Original:</div>
                  <div 
                    className="w-full h-16 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                    data-testid="original-preview"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-2">Filtered:</div>
                  <div 
                    className="w-full h-16 rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
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
              </div>
            </div>
          )}

          {/* Advanced Controls */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-left flex items-center justify-between mb-3"
              onClick={() => setShowAdvanced(!showAdvanced)}
              data-testid="advanced-toggle"
            >
              <span className="font-semibold">⚙️ Advanced Controls</span>
              <span className="text-xs text-gray-400">{showAdvanced ? 'Hide' : 'Show'}</span>
            </Button>
            
            {showAdvanced && (
              <div className="space-y-3 mt-3">
                {[
                  { key: 'highlights', label: 'Highlights', min: -50, max: 50 },
                  { key: 'shadows', label: 'Shadows', min: -50, max: 50 },
                  { key: 'temperature', label: 'Temperature', min: -30, max: 30 },
                  { key: 'tint', label: 'Tint', min: -50, max: 50 },
                  { key: 'vignette', label: 'Vignette', min: 0, max: 100 },
                  { key: 'grain', label: 'Film Grain', min: 0, max: 100 }
                ].map(({ key, label, min, max }) => (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs text-gray-300">{label}</label>
                      <span className="text-xs text-thoxt-yellow font-mono">
                        {advancedControls[key as keyof AdvancedControls]}
                      </span>
                    </div>
                    <Slider
                      value={[advancedControls[key as keyof AdvancedControls]]}
                      onValueChange={([value]) => 
                        setAdvancedControls(prev => ({ ...prev, [key]: value }))
                      }
                      min={min}
                      max={max}
                      step={1}
                      data-testid={`slider-${key}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2 sticky bottom-0 bg-black pb-2" data-testid="filter-actions">
            <Button
              className="flex-1 bg-gradient-to-r from-thoxt-yellow to-yellow-400 text-black font-bold hover:from-yellow-400 hover:to-thoxt-yellow transition-all shadow-lg"
              onClick={handleApplyFilter}
              disabled={!selectedFilter}
              data-testid="button-apply-filter"
            >
              ✨ Apply Filter
            </Button>
            
            <Button
              variant="outline"
              className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700 transition-colors"
              onClick={() => {
                setSelectedFilter(instagramFilters[0]);
                setCustomIntensity(0);
                setAdvancedControls({
                  highlights: 0,
                  shadows: 0,
                  temperature: 0,
                  tint: 0,
                  vignette: 0,
                  grain: 0
                });
              }}
              data-testid="button-reset-filter"
            >
              Reset
            </Button>
          </div>

          {/* Filter Info */}
          {selectedFilter && (
            <div className="bg-gradient-to-r from-gray-900 to-black p-3 rounded-lg text-xs text-gray-400 border border-gray-700" data-testid="filter-info">
              <div className="font-medium text-thoxt-yellow mb-1 flex items-center space-x-2">
                {selectedFilter.icon}
                <span>{selectedFilter.name} Filter</span>
              </div>
              <div>Category: {selectedFilter.category.charAt(0).toUpperCase() + selectedFilter.category.slice(1)}</div>
              <div className="mt-1 font-mono text-xs">{selectedFilter.cssFilter}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
