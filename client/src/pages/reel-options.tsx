import { useLocation } from "wouter";
import { Video, Scroll, Save } from "lucide-react";
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
      bgColor: "bg-gradient-to-br from-purple-500 to-pink-500"
    },
    {
      id: "create-reel",
      title: "Create Reel",
      description: "Record a new reel",
      icon: Video,
      action: () => setLocation('/reels-creator'),
      bgColor: "bg-gradient-to-br from-thoxt-yellow to-orange-500"
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
      bgColor: "bg-gradient-to-br from-blue-500 to-cyan-500"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6" data-testid="reel-options-page">
      <h2 className="text-white text-2xl font-bold mb-8 text-center">What would you like to do?</h2>
      
      <div className="flex flex-col gap-4 w-full max-w-sm">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.id}
              onClick={option.action}
              className={`${option.bgColor} h-24 flex flex-col items-center justify-center text-white hover:opacity-90 transition-opacity`}
              data-testid={`button-${option.id}`}
            >
              <Icon className="w-8 h-8 mb-2" />
              <span className="text-lg font-semibold">{option.title}</span>
              <span className="text-xs opacity-80">{option.description}</span>
            </Button>
          );
        })}
      </div>

      <Button
        variant="ghost"
        className="mt-8 text-white"
        onClick={() => setLocation('/')}
        data-testid="button-home"
      >
        Go to Home
      </Button>
    </div>
  );
}
