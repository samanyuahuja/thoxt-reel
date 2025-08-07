import { Home, Lightbulb, Users, Tags, Plus, Upload, Video, Gamepad2, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";

const navigationItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Lightbulb, label: "Thots", href: "/thots" },
  { icon: Users, label: "Following", href: "/following" },
  { icon: Tags, label: "Genres", href: "/genres" },
  { icon: Plus, label: "Post", href: "/post" },
  { icon: Upload, label: "Publish", href: "/publish" },
  { icon: Video, label: "Create Reels", href: "/reels" },
  { icon: BookOpen, label: "My Reels", href: "/saved-reels" },
  { icon: Gamepad2, label: "Games", href: "/games" }
];

export default function SidebarNavigation() {
  const [location] = useLocation();
  
  return (
    <div className="w-64 bg-thoxt-dark border-r border-gray-800 flex flex-col" data-testid="sidebar-nav">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800" data-testid="logo-section">
        <Link href="/">
          <h1 className="text-thoxt-yellow text-2xl font-bold cursor-pointer hover:text-yellow-400 transition-colors" data-testid="logo-text">thoxt</h1>
        </Link>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 py-4" data-testid="navigation-menu">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href === '/reels' && location === '/');
          
          return (
            <Link 
              key={index}
              href={item.href}
            >
              <div
                className={`flex items-center px-4 py-3 transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-thoxt-yellow text-black font-medium' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="mr-3 w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
