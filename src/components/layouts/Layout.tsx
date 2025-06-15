// src/components/layouts/Layout.tsx
// Changed: Added newMessagesCount and newEventsCount to MainNav props
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar, MessageSquare, List, Users, User } from "lucide-react";
import { Badge } from '@/components/ui/badge'; // Import Badge component
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  // Chat-specific props
  activeView?: 'ai' | 'community';
  setActiveView?: (view: 'ai' | 'community') => void;
  handleOpenUserDirectory?: () => void;
  setIsEventListSheetOpen?: (open: boolean) => void;
  newMessagesCount?: number; // Added newMessagesCount
  newEventsCount?: number; // Added newEventsCount
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  hideFooter = false,
  activeView,
  setActiveView,
  handleOpenUserDirectory,
  setIsEventListSheetOpen,
  newMessagesCount = 0, // Default to 0
  newEventsCount = 0 // Default to 0
}) => {
  const { pathname } = useLocation();
  const [isAddEventModalOpen, setIsAddEventModalOpen] = React.useState(false);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.triggerAddEvent = () => {
        setIsAddEventModalOpen(true);
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.triggerAddEvent;
      }
    };
  }, []);
  
  return (
    <>
      <Sheet open={isAddEventModalOpen} onOpenChange={setIsAddEventModalOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Event hinzufügen</SheetTitle>
            <SheetDescription>
              Erstelle ein neues Event für die Community.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              {/* Your form fields here */}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      
      <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-sm border-b border-black">
        <div className="container flex h-16 items-center">
          <MainNav 
            pathname={pathname}
            activeView={activeView}
            setActiveView={setActiveView}
            handleOpenUserDirectory={handleOpenUserDirectory}
            setIsEventListSheetOpen={setIsEventListSheetOpen}
            newMessagesCount={newMessagesCount}
            newEventsCount={newEventsCount}
          />
          {(pathname !== '/chat' && pathname !== '/') && ( 
            <div className="ml-auto flex items-center space-x-4">
              <ThemeToggleButton />
            </div>
          )}
        </div>
      </header>
      
      <main>
        {children}
      </main>
      
      {!hideFooter && (
        <footer className="border-t border-black bg-black">
          <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
            <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
              <a href="/" className="flex items-center space-x-2">
                <span className="font-bold inline-block">LIEBEFELD</span>
              </a>
              <p className="text-center text-sm leading-loose md:text-left">
                &copy; {new Date().getFullYear()} Liebefeld. All rights reserved.
              </p>
            </div>
            <div className="flex gap-4">
              <a href="/impressum" className="text-sm font-medium">
                Impressum
              </a>
              <a href="/privacy" className="text-sm font-medium">
                Datenschutz
              </a>
              <a href="/about" className="text-sm font-medium">
                Über uns
              </a>
            </div>
          </div>
        </footer>
      )}
    </>
  );
};

interface NavItem {
  title: string;
  href: string;
  external?: boolean;
}

const items: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "Chat", href: "/chat" },
  { title: "Über uns", href: "/about" }
];

interface MainNavProps {
  pathname: string;
  activeView?: 'ai' | 'community';
  setActiveView?: (view: 'ai' | 'community') => void;
  handleOpenUserDirectory?: () => void;
  setIsEventListSheetOpen?: (open: boolean) => void;
  newMessagesCount: number; // Added
  newEventsCount: number; // Added
}

const cities = [
  { name: "Bielefeld", abbr: "BI" },
  { name: "Berlin", abbr: "berlin" },
  { name: "Hamburg", abbr: "hamburg" },
  { name: "München", abbr: "munich" },
  { name: "Köln", abbr: "cologne" },
  { name: "Frankfurt", abbr: "frankfurt" },
  { name: "Stuttgart", abbr: "stuttgart" },
  { name: "Düsseldorf", abbr: "duesseldorf" },
  { name: "Leipzig", abbr: "leipzig" },
  { name: "Hannover", abbr: "hanover" },
  { name: "Nürnberg", abbr: "nuremberg" },
  { name: "Bremen", abbr: "bremen" },
  { name: "Dresden", abbr: "dresden" },
  { name: "Essen", abbr: "essen" },
  { name: "Dortmund", abbr: "dortmund" },
];

const MainNav: React.FC<MainNavProps> = ({ 
  pathname, 
  activeView, 
  setActiveView, 
  handleOpenUserDirectory, 
  setIsEventListSheetOpen,
  newMessagesCount, // Destructure
  newEventsCount // Destructure
}) => {
  const [city, setCity] = React.useState('BI');
  
  // If we're on chat page or the root path, show THE TRIBE + chat navigation buttons
  if (pathname === '/chat' || pathname === '/') {
    return (
      <div className="flex items-center w-full">
        <div className="flex flex-col items-start mr-6">
          <Link to="/" className="flex items-center">
            <span className="font-bold inline-block">THE TRIBE</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Button
                  variant="ghost"
                  className="p-0 h-auto font-bold text-white hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 hover:text-gray-300 active:bg-transparent hover:underline underline-offset-4 cursor-pointer -mt-1"
                >
                .{city}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-zinc-900 border-red-500/30">
              {cities.map((c) => (
                <DropdownMenuItem key={c.abbr} onClick={() => setCity(c.abbr)} className="text-white hover:bg-red-500/20 cursor-pointer focus:bg-red-500/20 focus:text-white">{c.name}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Chat navigation buttons */}
        <div className="flex items-center justify-between w-full">
          <div className="flex space-x-2">
            <Button 
              variant={activeView === 'ai' ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveView?.('ai')} 
              className={`flex items-center gap-0.5 px-1.5 py-1 relative ${activeView === 'ai' ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-[10px] px-1">Events</span>
              {newEventsCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-green-600 text-white h-4 w-4 flex items-center justify-center rounded-full text-[10px]">
                  {newEventsCount}
                </Badge>
              )}
            </Button>
            <Button 
              variant={activeView === 'community' ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveView?.('community')} 
              className={`flex items-center gap-0.5 px-1.5 py-1 relative ${activeView === 'community' ? 'bg-red-500 hover:bg-red-600' : ''}`}
            >
              <Users className="h-4 w-4" />
              <span className="text-[10px] px-1">Community</span>
              {newMessagesCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-green-600 text-white h-4 w-4 flex items-center justify-center rounded-full text-[10px]">
                  {newMessagesCount}
                </Badge>
              )}
            </Button>
          </div>
          
          <div className="flex gap-2">
            {/* User Directory Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleOpenUserDirectory} 
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Benutzer</span>
            </Button>
            
            {/* Calendar Events Button */}
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => setIsEventListSheetOpen?.(true)} 
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">Events anzeigen</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // For other pages, show regular navigation
  return (
    <div className="mr-4 flex">
      <Link to="/" className="mr-6 flex items-center space-x-2">
        <span className="font-bold inline-block">THE TRIBE</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        {items.map((item, index) => (
          <Link
            key={index}
            to={item.href}
            className={cn(
              "transition-colors hover:text-foreground/80",
              pathname === item.href ? "text-foreground" : "text-foreground/60"
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  );
};

const ThemeToggleButton = () => {
  return (
    <Button variant="ghost" size="icon" className="rounded-full">
      <span className="sr-only">Toggle theme</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path>
        <path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path>
        <path d="m19.07 4.93-1.41 1.41"></path>
      </svg>
    </Button>
  );
};
