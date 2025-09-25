import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Lightbulb, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarNavigation from "@/components/ui/sidebar-navigation";

export default function Thots() {
  return (
    <div className="flex h-screen bg-thoxt-dark text-white">
      <SidebarNavigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="thots-title">Your Thots</h1>
              <p className="text-gray-400">Transform your ideas and articles into engaging video content</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Sample thots/articles */}
              <Card className="bg-thoxt-gray border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Lightbulb className="w-6 h-6 text-thoxt-yellow" />
                    <span className="text-sm text-gray-400">Article</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Tech Trends 2024</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-4">Exploring the latest technology trends shaping the future...</p>
                  <Button 
                    className="w-full bg-thoxt-yellow text-black hover:bg-yellow-400"
                    data-testid="button-create-reel"
                  >
                    Create Reel
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-thoxt-gray border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Lightbulb className="w-6 h-6 text-thoxt-yellow" />
                    <span className="text-sm text-gray-400">Idea</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">Video Marketing Tips</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-4">Share insights on effective video marketing strategies...</p>
                  <Button 
                    className="w-full bg-thoxt-yellow text-black hover:bg-yellow-400"
                    data-testid="button-create-reel"
                  >
                    Create Reel
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-600 border-dashed flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <Plus className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-500">Add new thot</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}