import { Home, Lightbulb, Users, Tags, Plus, Upload, Video, Gamepad2 } from "lucide-react";

const navigationItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Lightbulb, label: "Thots", href: "/thots" },
  { icon: Users, label: "Following", href: "/following" },
  { icon: Tags, label: "Genres", href: "/genres" },
  { icon: Plus, label: "Post", href: "/post" },
  { icon: Upload, label: "Publish", href: "/publish" },
  { icon: Video, label: "Reels", href: "/reels", active: true },
  { icon: Gamepad2, label: "Games", href: "/games" }
];

export default function SidebarNavigation() {
  return (
    <div className="w-64 bg-thoxt-dark border-r border-gray-800 flex flex-col" data-testid="sidebar-nav">
      {/* Logo */}
      <div className="p-4 border-b border-gray-800" data-testid="logo-section">
        <h1 className="text-thoxt-yellow text-2xl font-bold" data-testid="logo-text">thoxt</h1>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 py-4" data-testid="navigation-menu">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.active;
          
          return (
            <a 
              key={index}
              href={item.href} 
              className={`flex items-center px-4 py-3 transition-colors ${
                isActive 
                  ? 'bg-thoxt-yellow text-black font-medium' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className="mr-3 w-5 h-5" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
}
