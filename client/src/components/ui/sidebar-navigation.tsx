import { Home, Lightbulb, Users, Tags, Plus, Upload, Video, Gamepad2, BookOpen, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "./button";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-thoxt-dark border-b border-gray-800 p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-40" data-testid="mobile-header">
        <Link href="/">
          <h1 className="text-thoxt-yellow text-xl font-bold cursor-pointer hover:text-yellow-400 transition-colors" data-testid="mobile-logo">thoxt</h1>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          data-testid="mobile-menu-toggle"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" 
          onClick={() => setIsMobileMenuOpen(false)}
          data-testid="mobile-menu-overlay"
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-thoxt-dark border-r border-gray-800 flex-col" data-testid="desktop-sidebar">
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

      {/* Mobile Sidebar */}
      <div 
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-thoxt-dark border-r border-gray-800 transform transition-transform duration-300 ease-in-out z-40 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="mobile-sidebar"
      >
        {/* Mobile Logo */}
        <div className="p-4 border-b border-gray-800 mt-16">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
            <h1 className="text-thoxt-yellow text-2xl font-bold cursor-pointer hover:text-yellow-400 transition-colors">thoxt</h1>
          </Link>
        </div>
        
        {/* Mobile Navigation Menu */}
        <nav className="flex-1 py-4">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href === '/reels' && location === '/');
            
            return (
              <Link 
                key={index}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div
                  className={`flex items-center px-4 py-3 transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-thoxt-yellow text-black font-medium' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                  data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="mr-3 w-5 h-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}