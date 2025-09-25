import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarNavigation from "@/components/ui/sidebar-navigation";

export default function Following() {
  return (
    <div className="flex h-screen bg-thoxt-dark text-white">
      <SidebarNavigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="following-title">Following</h1>
              <p className="text-gray-400">Stay connected with your favorite creators</p>
            </div>

            <div className="text-center py-16">
              <Users className="w-24 h-24 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-300 mb-2">No Following Yet</h2>
              <p className="text-gray-500 mb-6">Start following creators to see their content here</p>
              <Button 
                className="bg-thoxt-yellow text-black hover:bg-yellow-400"
                data-testid="button-discover-creators"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Discover Creators
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}