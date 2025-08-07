import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";

interface FiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const filters = [
  { name: "Vibrant", gradient: "from-pink-500 to-purple-500" },
  { name: "Cool", gradient: "from-blue-500 to-teal-500" },
  { name: "Warm", gradient: "from-yellow-500 to-orange-500" },
  { name: "Vintage", gradient: "from-amber-600 to-yellow-600" },
  { name: "B&W", gradient: "from-gray-600 to-gray-400" },
  { name: "Neon", gradient: "from-green-400 to-blue-500" },
];

export default function FiltersModal({ isOpen, onClose }: FiltersModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-thoxt-gray border-gray-700 text-white w-96" data-testid="filters-modal">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold" data-testid="filters-modal-title">
            Filters & Effects
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-3 mt-4" data-testid="filters-grid">
          {filters.map((filter, index) => (
            <div 
              key={index}
              className="bg-gray-700 p-3 rounded text-center cursor-pointer hover:bg-thoxt-yellow hover:text-black transition-colors"
              data-testid={`filter-${filter.name.toLowerCase()}`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${filter.gradient} rounded mb-2 mx-auto`} />
              <div className="text-xs">{filter.name}</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
