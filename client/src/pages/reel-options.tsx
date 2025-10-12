import { useLocation } from "wouter";
import { Video, Scroll, Grid, Home, ChevronRight } from "lucide-react";

export default function ReelOptions() {
  const [, setLocation] = useLocation();

  const options = [
    {
      id: "saved-reels",
      title: "My Reels",
      description: "View and manage your saved reels",
      icon: Grid,
      action: () => setLocation('/my-reels'),
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/30",
      hoverBg: "hover:bg-purple-500/10"
    },
    {
      id: "create-reel",
      title: "Create New Reel",
      description: "Record and edit a new video",
      icon: Video,
      action: () => setLocation('/reels-creator'),
      iconBg: "bg-thoxt-yellow/20",
      iconColor: "text-thoxt-yellow",
      borderColor: "border-thoxt-yellow/30",
      hoverBg: "hover:bg-thoxt-yellow/10"
    },
    {
      id: "ai-teleprompter",
      title: "AI Teleprompter",
      description: "Record with AI-generated script",
      icon: Scroll,
      action: () => {
        setLocation('/reels-creator');
      },
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/30",
      hoverBg: "hover:bg-blue-500/10"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black flex flex-col" data-testid="reel-options-page">
      {/* Header */}
      <div className="px-6 pt-12 pb-8">
        <h1 className="text-thoxt-yellow text-3xl font-bold mb-1">thoxt</h1>
        <p className="text-gray-500 text-sm">Create amazing reels</p>
      </div>
      
      {/* Options List */}
      <div className="flex-1 px-4 pb-6 overflow-y-auto">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={option.action}
              className={`w-full bg-zinc-900/60 border ${option.borderColor} rounded-2xl p-5 mb-3 
                         transform transition-all duration-200 active:scale-[0.96] 
                         ${option.hoverBg} hover:border-opacity-50`}
              data-testid={`button-${option.id}`}
            >
              <div className="flex items-center gap-4">
                <div className={`${option.iconBg} rounded-full p-3.5`}>
                  <Icon className={`w-6 h-6 ${option.iconColor}`} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white text-lg font-semibold mb-0.5">{option.title}</h3>
                  <p className="text-gray-400 text-sm">{option.description}</p>
                </div>
                <ChevronRight className={`w-5 h-5 ${option.iconColor} opacity-60`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-4">
        <button
          className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white 
                     transition-colors py-3 rounded-xl hover:bg-zinc-900/50"
          onClick={() => setLocation('/')}
          data-testid="button-home"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>
      </div>
    </div>
  );
}
