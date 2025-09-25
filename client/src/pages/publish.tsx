import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Upload, Share2, Globe, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SidebarNavigation from "@/components/ui/sidebar-navigation";

export default function Publish() {
  return (
    <div className="flex h-screen bg-thoxt-dark text-white">
      <SidebarNavigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="publish-title">Publish</h1>
              <p className="text-gray-400">Share your content across platforms</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ready to Publish */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Ready to Publish</h2>
                <Card className="bg-thoxt-gray border-gray-700" data-testid="card-ready-content">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Test Stream Recording</h3>
                      <Badge className="bg-green-600 text-white">Ready</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center text-gray-400 text-sm">
                        <Clock className="w-4 h-4 mr-2" />
                        Duration: 15 seconds
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" className="bg-thoxt-yellow text-black hover:bg-yellow-400" data-testid="button-publish-now">
                          <Upload className="w-4 h-4 mr-2" />
                          Publish Now
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300" data-testid="button-schedule">
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Publishing Platforms */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Connected Platforms</h2>
                <div className="space-y-4">
                  <Card className="bg-thoxt-gray border-gray-700" data-testid="card-platform">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Globe className="w-6 h-6 text-thoxt-yellow mr-3" />
                          <span className="text-white">Thoxt Platform</span>
                        </div>
                        <Badge className="bg-green-600 text-white">Connected</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-thoxt-gray border-gray-700" data-testid="card-social-media">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Share2 className="w-6 h-6 text-gray-500 mr-3" />
                          <span className="text-gray-400">Social Media</span>
                        </div>
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300" data-testid="button-connect-social">
                          Connect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}