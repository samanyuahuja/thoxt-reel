import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Plus, FileText, Video, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarNavigation from "@/components/ui/sidebar-navigation";

export default function Post() {
  return (
    <div className="flex h-screen bg-thoxt-dark text-white">
      <SidebarNavigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="post-title">Create Post</h1>
              <p className="text-gray-400">Share your content with the world</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-thoxt-gray border-gray-700 hover:border-thoxt-yellow transition-colors cursor-pointer" data-testid="card-text-post">
                <CardHeader>
                  <FileText className="w-12 h-12 text-thoxt-yellow mx-auto mb-2" />
                  <h3 className="text-xl font-semibold text-white text-center">Text Post</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-center mb-4">Share your thoughts and ideas in text format</p>
                  <Button className="w-full bg-thoxt-yellow text-black hover:bg-yellow-400" data-testid="button-create-text">
                    Create Text Post
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-thoxt-gray border-gray-700 hover:border-thoxt-yellow transition-colors cursor-pointer" data-testid="card-video-post">
                <CardHeader>
                  <Video className="w-12 h-12 text-thoxt-yellow mx-auto mb-2" />
                  <h3 className="text-xl font-semibold text-white text-center">Video Reel</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-center mb-4">Create engaging video content with AI assistance</p>
                  <Button className="w-full bg-thoxt-yellow text-black hover:bg-yellow-400" data-testid="button-create-reel">
                    Create Video Reel
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-thoxt-gray border-gray-700 hover:border-thoxt-yellow transition-colors cursor-pointer" data-testid="card-image-post">
                <CardHeader>
                  <Image className="w-12 h-12 text-thoxt-yellow mx-auto mb-2" />
                  <h3 className="text-xl font-semibold text-white text-center">Image Post</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-center mb-4">Share visual content with your audience</p>
                  <Button className="w-full bg-thoxt-yellow text-black hover:bg-yellow-400" data-testid="button-create-image">
                    Create Image Post
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}