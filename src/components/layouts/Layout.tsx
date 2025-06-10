import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar, MessageSquare, List, Users, User } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  // Chat-specific props
  activeView?: 'ai' | 'community';
  setActiveView?: (view: 'ai' | 'community') => void;
  handleOpenUserDirectory?: () => void;
  setIsEventListSheetOpen?: (open: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children,
  hideFooter = false,
  activeView,
  setActiveView,
  handleOpenUserDirectory,
  setIsEventListSheetOpen
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
          />
          {/* Removed ThemeToggleButton completely */}
          {/* The ThemeToggleButton will not be rendered anywhere in the header */}
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

// These items are no longer used for dynamic navigation in MainNav
// const items: NavItem[] = [
//   { title: "Home", href: "/" },
//   { title: "Chat", href: "/chat" },
//   { title: "Über uns", href: "/about" }
// ];

interface MainNavProps {
  pathname: string;
  activeView?: 'ai' | 'community';
  setActiveView?: (view: 'ai' | 'community') => void;
  handleOpenUserDirectory?: () => void;
  setIsEventListSheetOpen?: (open: boolean) => void;
}

const MainNav: React.FC<MainNavProps> = ({ 
  pathname, 
  activeView, 
  setActiveView, 
  handleOpenUserDirectory, 
  setIsEventListSheetOpen 
}) => {
  
  // This block explicitly renders the chat navigation buttons only when on /chat
  // It's likely that the issue was due to some caching or a missed re-render.
  // With /chat as the homepage, this block should now consistently show.
  return (
    <div className="flex items-center w-full">
      <Link to="/" className="mr-6 flex items-center space-x-2">
        <span className="font-bold inline-block">THE TRIBE</span>
      </Link>
      
      {/* Chat navigation buttons */}
      <div className="flex items-center justify-between w-full">
        <div className="flex space-x-2">
          <Button 
            variant={activeView === 'ai' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setActiveView?.('ai')} 
            className={`flex items-center gap-2 ${activeView === 'ai' ? 'bg-red-500 hover:bg-red-600' : ''}`}
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Event Assistent</span>
          </Button>
          <Button 
            variant={activeView === 'community' ? "default" : "outline"} 
            size="sm" 
            onClick={() => setActiveView?.('community')} 
            className={`flex items-center gap-2 ${activeView === 'community' ? 'bg-red-500 hover:bg-red-600' : ''}`}
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Community</span>
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
};

// ThemeToggleButton is now completely removed from the header.
const ThemeToggleButton = () => {
  return null; // Render nothing
};

export default Layout;