import { useState } from "react";
import { Bot, Scissors, Captions, VolumeX, Download } from "lucide-react";
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch articles
  const { data: articles, isLoading: articlesLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  // Script generation mutation
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
        title: "Script Generated!",
        description: "Your AI-generated script is ready for recording.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate script. Please try again.",
        variant: "destructive",
      });
      console.error("Script generation error:", error);
    },
  });

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
        title: "Script Applied",
        description: "Script is now available in the teleprompter.",
      });
    }
  };

  return (
    <div className="w-80 bg-thoxt-dark border-l border-gray-800 flex flex-col" data-testid="ai-tools-sidebar">
      {/* AI Script Generator */}
      <div className="p-4 border-b border-gray-800" data-testid="script-generator-section">
        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <Bot className="text-thoxt-yellow mr-2 w-5 h-5" />
          AI Script Generator
        </h3>
        
        <div className="space-y-3">
          {/* Article or Topic Selection */}
          <div className="space-y-2">
            <Select 
              value={selectedArticleId} 
              onValueChange={setSelectedArticleId}
              disabled={articlesLoading || !!customTopic}
            >
              <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700" data-testid="select-article">
                <SelectValue placeholder="Select Article Source" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white border-gray-700">
                {articles?.map((article) => (
                  <SelectItem key={article.id} value={article.id} data-testid={`option-article-${article.id}`}>
                    {article.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-center text-gray-400 text-sm">OR</div>

            <input
              type="text"
              placeholder="Enter custom topic..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              className="w-full bg-gray-800 text-white p-2 rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-thoxt-yellow"
              disabled={!!selectedArticleId}
              data-testid="input-custom-topic"
            />
          </div>

          {/* Tone Selection */}
          <Select value={selectedTone} onValueChange={setSelectedTone}>
            <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700" data-testid="select-tone">
              <SelectValue placeholder="Select Tone" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="engaging" data-testid="option-tone-engaging">Engaging</SelectItem>
              <SelectItem value="formal" data-testid="option-tone-formal">Formal</SelectItem>
              <SelectItem value="funny" data-testid="option-tone-funny">Funny</SelectItem>
              <SelectItem value="educational" data-testid="option-tone-educational">Educational</SelectItem>
            </SelectContent>
          </Select>

          {/* Duration Selection */}
          <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(parseInt(value))}>
            <SelectTrigger className="w-full bg-gray-800 text-white border-gray-700" data-testid="select-duration">
              <SelectValue placeholder="Select Duration" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="15" data-testid="option-duration-15">15 seconds</SelectItem>
              <SelectItem value="30" data-testid="option-duration-30">30 seconds</SelectItem>
              <SelectItem value="60" data-testid="option-duration-60">60 seconds</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            className="w-full bg-thoxt-yellow text-black font-medium hover:bg-yellow-400 transition-colors"
            onClick={handleGenerateScript}
            disabled={generateScriptMutation.isPending}
            data-testid="button-generate-script"
          >
            {generateScriptMutation.isPending ? "Generating..." : "Generate Script"}
          </Button>
        </div>
      </div>

      {/* Script Preview */}
      <div className="p-4 border-b border-gray-800 flex-1 overflow-y-auto" data-testid="script-preview-section">
        <h4 className="text-md font-medium mb-3" data-testid="script-preview-title">Generated Script</h4>
        
        <div className="bg-gray-800 p-3 rounded text-sm leading-relaxed max-h-40 overflow-y-auto mb-3" data-testid="script-preview-text">
          {generatedScript ? (
            <p>{generatedScript}</p>
          ) : (
            <p className="text-gray-400">Click "Generate Script" to create AI-powered content for your reel...</p>
          )}
        </div>
        
        <div className="flex space-x-2" data-testid="script-actions">
          <Button 
            variant="outline"
            className="flex-1 bg-gray-700 text-white border-gray-600 hover:bg-gray-600 transition-colors text-sm"
            disabled={!generatedScript}
            data-testid="button-edit-script"
          >
            Edit Script
          </Button>
          
          <Button 
            className="flex-1 bg-thoxt-yellow text-black hover:bg-yellow-400 transition-colors text-sm"
            onClick={handleUseScript}
            disabled={!generatedScript}
            data-testid="button-use-script"
          >
            Use Script
          </Button>
        </div>
      </div>

      {/* Quick Tools */}
      <div className="p-4" data-testid="quick-tools-section">
        <h4 className="text-md font-medium mb-3" data-testid="quick-tools-title">Quick Tools</h4>
        
        <div className="grid grid-cols-2 gap-2" data-testid="quick-tools-grid">
          <Button 
            variant="outline"
            className="bg-gray-800 border-gray-700 p-3 rounded text-center hover:bg-gray-700 transition-colors flex flex-col items-center"
            data-testid="button-auto-edit"
          >
            <Scissors className="text-thoxt-yellow mb-1 w-5 h-5" />
            <div className="text-xs">Auto Edit</div>
          </Button>
          
          <Button 
            variant="outline"
            className="bg-gray-800 border-gray-700 p-3 rounded text-center hover:bg-gray-700 transition-colors flex flex-col items-center"
            data-testid="button-captions"
          >
            <Captions className="text-thoxt-yellow mb-1 w-5 h-5" />
            <div className="text-xs">Captions</div>
          </Button>
          
          <Button 
            variant="outline"
            className="bg-gray-800 border-gray-700 p-3 rounded text-center hover:bg-gray-700 transition-colors flex flex-col items-center"
            data-testid="button-clean-audio"
          >
            <VolumeX className="text-thoxt-yellow mb-1 w-5 h-5" />
            <div className="text-xs">Clean Audio</div>
          </Button>
          
          <Button 
            variant="outline"
            className="bg-gray-800 border-gray-700 p-3 rounded text-center hover:bg-gray-700 transition-colors flex flex-col items-center"
            data-testid="button-export"
          >
            <Download className="text-thoxt-yellow mb-1 w-5 h-5" />
            <div className="text-xs">Export</div>
          </Button>
        </div>
      </div>
    </div>
  );
}
