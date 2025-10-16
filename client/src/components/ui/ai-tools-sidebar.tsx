import { useState } from "react";
import { Bot, Scissors, Captions, VolumeX, Download, BookOpen } from "lucide-react";
import ScriptTranscriptModal from "./script-transcript-modal";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@shared/schema";

interface AIToolsSidebarProps {
  onScriptGenerated: (script: string) => void;
}

export default function AIToolsSidebar({ onScriptGenerated }: AIToolsSidebarProps) {
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("engaging");
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [customTopic, setCustomTopic] = useState<string>("");
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [showTranscript, setShowTranscript] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: articles, isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const generateScriptMutation = useMutation({
    mutationFn: async (params: { 
      articleId?: string; 
      customTopic?: string;
      tone: string; 
      duration: number; 
    }) => {
      const response = await apiRequest("POST", "/api/generate-script", params);
      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedScript(data.script);
      onScriptGenerated(data.script);
      toast({
        title: "🤖 Script Generated!",
        description: `AI created a ${data.estimatedDuration || selectedDuration}s ${selectedTone} script. Ready for recording!`,
      });
    },
    onError: (error) => {
      console.error("Script generation error:", error);
      const fallbackScript = generateFallbackScript(customTopic || selectedArticleId, selectedTone, selectedDuration);
      setGeneratedScript(fallbackScript);
      onScriptGenerated(fallbackScript);
      
      toast({
        title: "🎭 Demo Script Ready",
        description: "API unavailable - using demo script for testing. Perfect for trying the teleprompter!",
        variant: "default",
      });
    },
  });

  const generateFallbackScript = (source: string, tone: string, duration: number): string => {
    const toneStyles = {
      engaging: "Hey everyone! 🔥",
      formal: "Welcome to today's topic.",
      funny: "So... this is happening! 😄",
      educational: "Let's explore this together."
    };
    
    const opener = toneStyles[tone as keyof typeof toneStyles] || toneStyles.engaging;
    const topic = customTopic || "this amazing topic";
    
    if (duration === 15) {
      return `${opener} Today we're talking about ${topic}. This is something you need to know about. What do you think? Drop a comment! 💭`;
    } else if (duration === 30) {
      return `${opener} Let's dive into ${topic} today! This is really important because it affects all of us. Here's what you need to know - it's changing how we think about everything. What's your take on this? Share your thoughts below! 🚀`;
    } else {
      return `${opener} Welcome back! Today I want to talk about ${topic} and why it matters to all of us. This is something I've been thinking about a lot lately, and I think you'll find it really interesting too. The key thing to understand is that this impacts our daily lives in ways we might not even realize. So here's what I've learned, and I'd love to hear your perspective on this. Make sure to subscribe for more content like this, and let me know in the comments what you think! 🎯`;
    }
  };

  const handleGenerateScript = () => {
    if (!selectedTone || !selectedDuration) {
      toast({
        title: "Missing Information",
        description: "Please select tone and duration.",
        variant: "destructive",
      });
      return;
    }

    const params = {
      tone: selectedTone,
      duration: selectedDuration,
      ...(customTopic ? { customTopic } : { articleId: selectedArticleId })
    };

    if (!customTopic && !selectedArticleId) {
      toast({
        title: "Missing Source",
        description: "Please select an article or enter a custom topic.",
        variant: "destructive",
      });
      return;
    }

    generateScriptMutation.mutate(params);
  };

  const handleUseScript = () => {
    if (generatedScript) {
      onScriptGenerated(generatedScript);
      toast({
        title: "🎬 Script Applied!",
        description: "Script is now available in the teleprompter and ready for recording.",
      });
    }
  };

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col" data-testid="ai-tools-sidebar">
      {/* AI Script Generator */}
      <div className="p-4 border-b border-border" data-testid="script-generator-section">
        <h3 className="text-lg font-semibold mb-3 flex items-center text-card-foreground">
          <Bot className="text-primary mr-2 w-5 h-5" />
          AI Script Generator
        </h3>
        
        <div className="space-y-3">
          {/* Article or Topic Selection */}
          <div className="space-y-2">
            <Select 
              value={selectedArticleId} 
              onValueChange={(value) => {
                setSelectedArticleId(value);
                if (value) {
                  setCustomTopic(""); 
                }
              }}
              disabled={articlesLoading || !!customTopic}
            >
              <SelectTrigger className="w-full bg-input text-foreground border-border" data-testid="select-article">
                <SelectValue placeholder="Select Article Source" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                {articles?.map((article) => (
                  <SelectItem key={article.id} value={article.id} data-testid={`option-article-${article.id}`}>
                    {article.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-center text-muted-foreground text-sm">OR</div>

            <input
              type="text"
              placeholder="Enter custom topic..."
              value={customTopic}
              onChange={(e) => {
                setCustomTopic(e.target.value);
                if (e.target.value) {
                  setSelectedArticleId(""); 
                }
              }}
              className="w-full bg-input text-foreground p-2 rounded border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={!!selectedArticleId}
              data-testid="input-custom-topic"
            />
          </div>

          {/* Tone Selection */}
          <Select value={selectedTone} onValueChange={setSelectedTone}>
            <SelectTrigger className="w-full bg-input text-foreground border-border" data-testid="select-tone">
              <SelectValue placeholder="Select Tone" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border">
              <SelectItem value="engaging" data-testid="option-tone-engaging">Engaging</SelectItem>
              <SelectItem value="formal" data-testid="option-tone-formal">Formal</SelectItem>
              <SelectItem value="funny" data-testid="option-tone-funny">Funny</SelectItem>
              <SelectItem value="educational" data-testid="option-tone-educational">Educational</SelectItem>
            </SelectContent>
          </Select>

          {/* Duration Selection */}
          <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(parseInt(value))}>
            <SelectTrigger className="w-full bg-input text-foreground border-border" data-testid="select-duration">
              <SelectValue placeholder="Select Duration" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border">
              <SelectItem value="15" data-testid="option-duration-15">15 seconds</SelectItem>
              <SelectItem value="30" data-testid="option-duration-30">30 seconds</SelectItem>
              <SelectItem value="60" data-testid="option-duration-60">60 seconds</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            className="w-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            onClick={handleGenerateScript}
            disabled={generateScriptMutation.isPending}
            data-testid="button-generate-script"
          >
            {generateScriptMutation.isPending ? "Generating..." : "Generate Script"}
          </Button>
        </div>
      </div>

      {/* Script Preview */}
      <div className="p-4 border-b border-border flex-1 overflow-y-auto" data-testid="script-preview-section">
        <h4 className="text-md font-medium mb-3 text-card-foreground" data-testid="script-preview-title">Generated Script</h4>
        
        <div className="bg-muted p-3 rounded text-sm leading-relaxed max-h-40 overflow-y-auto mb-3" data-testid="script-preview-text">
          {generatedScript ? (
            <p>{generatedScript}</p>
          ) : (
            <p className="text-muted-foreground">Click "Generate Script" to create AI-powered content for your reel...</p>
          )}
        </div>
        
        <div className="space-y-2" data-testid="script-actions">
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              className="flex-1 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80 transition-colors text-sm"
              disabled={!generatedScript}
              data-testid="button-edit-script"
            >
              Edit Script
            </Button>
            
            <Button 
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
              onClick={handleUseScript}
              disabled={!generatedScript}
              data-testid="button-use-script"
            >
              Use Script
            </Button>
          </div>
          
          <Button 
            variant="outline"
            className="w-full bg-secondary text-secondary-foreground border-border hover:bg-secondary/80 transition-colors text-sm flex items-center justify-center"
            onClick={() => setShowTranscript(true)}
            disabled={!generatedScript}
            data-testid="button-open-transcript"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Read Transcript
          </Button>
        </div>
      </div>

      {/* Quick Tools */}
      <div className="p-4" data-testid="quick-tools-section">
        <h4 className="text-md font-medium mb-3 text-card-foreground" data-testid="quick-tools-title">Quick Tools</h4>
        
        <div className="grid grid-cols-2 gap-2" data-testid="quick-tools-grid">
          <Button 
            variant="outline"
            className="bg-secondary border-border p-3 rounded text-center hover:bg-secondary/80 transition-colors flex flex-col items-center"
            onClick={() => {
              toast({
                title: "🎬 Auto Edit",
                description: "Auto Edit feature coming soon! AI will automatically edit your video with cuts, transitions, and effects.",
              });
            }}
            data-testid="button-auto-edit"
          >
            <Scissors className="text-primary mb-1 w-5 h-5" />
            <div className="text-xs">Auto Edit</div>
          </Button>
          
          <Button 
            variant="outline"
            className="bg-secondary border-border p-3 rounded text-center hover:bg-secondary/80 transition-colors flex flex-col items-center"
            onClick={() => {
              toast({
                title: "📝 Auto Captions",
                description: "Auto Captions feature coming soon! AI will generate accurate captions for your video.",
              });
            }}
            data-testid="button-captions"
          >
            <Captions className="text-primary mb-1 w-5 h-5" />
            <div className="text-xs">Captions</div>
          </Button>
          
          <Button 
            variant="outline"
            className="bg-secondary border-border p-3 rounded text-center hover:bg-secondary/80 transition-colors flex flex-col items-center"
            onClick={() => {
              toast({
                title: "🔊 Clean Audio",
                description: "Clean Audio feature coming soon! AI will remove background noise and enhance your voice.",
              });
            }}
            data-testid="button-clean-audio"
          >
            <VolumeX className="text-primary mb-1 w-5 h-5" />
            <div className="text-xs">Clean Audio</div>
          </Button>
          
          <Button 
            variant="outline"
            className="bg-secondary border-border p-3 rounded text-center hover:bg-secondary/80 transition-colors flex flex-col items-center"
            onClick={() => {
              toast({
                title: "💾 Export",
                description: "Export feature coming soon! Download your video in multiple formats and resolutions.",
              });
            }}
            data-testid="button-export"
          >
            <Download className="text-primary mb-1 w-5 h-5" />
            <div className="text-xs">Export</div>
          </Button>
        </div>
      </div>
      
      {/* Script Transcript Modal */}
      <ScriptTranscriptModal 
        isOpen={showTranscript}
        onClose={() => setShowTranscript(false)}
        script={generatedScript}
      />
    </div>
  );
}
