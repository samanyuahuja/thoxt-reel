import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SidebarNavigation from "@/components/ui/sidebar-navigation";

export default function Genres() {
  const genres = [
    { name: "Technology", count: 128, color: "bg-blue-600" },
    { name: "Business", count: 95, color: "bg-green-600" },
    { name: "Entertainment", count: 87, color: "bg-purple-600" },
    { name: "Education", count: 76, color: "bg-yellow-600" },
    { name: "Health", count: 64, color: "bg-red-600" },
    { name: "Sports", count: 52, color: "bg-orange-600" },
  ];

  return (
    <div className="flex h-screen bg-thoxt-dark text-white">
      <SidebarNavigation />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="genres-title">Genres</h1>
              <p className="text-gray-400">Explore content by category</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {genres.map((genre, index) => (
                <Card key={index} className="bg-thoxt-gray border-gray-700 hover:border-thoxt-yellow transition-colors cursor-pointer" data-testid={`genre-card-${genre.name.toLowerCase()}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${genre.color} mr-3`} />
                        <Tags className="w-5 h-5 text-thoxt-yellow mr-2" />
                        <h3 className="text-lg font-semibold text-white">{genre.name}</h3>
                      </div>
                      <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                        {genre.count}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 text-sm">
                      Discover {genre.count} reels in {genre.name.toLowerCase()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}