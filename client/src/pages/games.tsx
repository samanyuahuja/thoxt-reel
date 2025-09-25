import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Gamepad2, Trophy, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SidebarNavigation from "@/components/ui/sidebar-navigation";

export default function Games() {
  return (
    <div className="flex h-screen bg-thoxt-dark text-white">
      <SidebarNavigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="games-title">Games</h1>
              <p className="text-gray-400">Interactive experiences and challenges</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-thoxt-gray border-gray-700 hover:border-thoxt-yellow transition-colors cursor-pointer" data-testid="card-video-challenge">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Zap className="w-8 h-8 text-thoxt-yellow" />
                    <Badge className="bg-orange-600 text-white">Popular</Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Video Challenge</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">Create a video in under 30 seconds on a trending topic</p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Users className="w-4 h-4 mr-2" />
                    1.2k participants
                  </div>
                  <Button className="w-full bg-thoxt-yellow text-black hover:bg-yellow-400" data-testid="button-join-challenge">
                    Join Challenge
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-thoxt-gray border-gray-700 hover:border-thoxt-yellow transition-colors cursor-pointer" data-testid="card-trivia">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Trophy className="w-8 h-8 text-thoxt-yellow" />
                    <Badge className="bg-green-600 text-white">Live</Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Daily Trivia</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">Test your knowledge on various topics and win rewards</p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Trophy className="w-4 h-4 mr-2" />
                    Today's prize: 100 points
                  </div>
                  <Button className="w-full bg-thoxt-yellow text-black hover:bg-yellow-400" data-testid="button-play-trivia">
                    Play Now
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-thoxt-gray border-gray-700 hover:border-thoxt-yellow transition-colors cursor-pointer" data-testid="card-content-battle">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Gamepad2 className="w-8 h-8 text-thoxt-yellow" />
                    <Badge className="bg-purple-600 text-white">New</Badge>
                  </div>
                  <h3 className="text-xl font-semibold text-white">Content Battle</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">Compete with other creators in real-time content creation</p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Users className="w-4 h-4 mr-2" />
                    Next battle: 2:00 PM
                  </div>
                  <Button className="w-full bg-thoxt-yellow text-black hover:bg-yellow-400" data-testid="button-join-battle">
                    Join Battle
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