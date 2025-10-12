import { useLocation } from "wouter";
import { Video, Scroll, Save, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReelOptions() {
  const [, setLocation] = useLocation();

  const options = [
    {
      id: "saved-reels",
      title: "Saved Reels",
      description: "View your saved reels",
      icon: Save,
      action: () => setLocation('/my-reels'),
      gradient: "from-purple-600 via-pink-600 to-purple-700"
    },
    {
      id: "create-reel",
      title: "Create Reel",
      description: "Record a new reel",
      icon: Video,
      action: () => setLocation('/reels-creator'),
      gradient: "from-thoxt-yellow via-orange-500 to-red-500"
    },
    {
      id: "ai-teleprompter",
      title: "AI Teleprompter",
      description: "Create with AI script",
      icon: Scroll,
      action: () => {
        setLocation('/reels-creator');
        // Could pass a flag to open teleprompter automatically
      },
      gradient: "from-blue-600 via-cyan-500 to-teal-600"
    }
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-black via-gray-900 to-black flex flex-col items-center justify-center p-6" data-testid="reel-options-page">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-thoxt-yellow text-4xl font-bold mb-2">thoxt</h1>
        <p className="text-gray-400 text-sm">What would you like to do?</p>
      </div>
      
      {/* Options Grid */}
      <div className="flex flex-col gap-5 w-full max-w-md px-4">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={option.action}
              className={`bg-gradient-to-br ${option.gradient} rounded-2xl p-6 shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95`}
              data-testid={`button-${option.id}`}
            >
              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white text-xl font-bold">{option.title}</h3>
                  <p className="text-white text-sm opacity-80">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Home Button */}
      <button
        className="mt-12 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        onClick={() => setLocation('/')}
        data-testid="button-home"
      >
        <Home className="w-5 h-5" />
        <span>Back to Home</span>
      </button>
    </div>
  );
}
