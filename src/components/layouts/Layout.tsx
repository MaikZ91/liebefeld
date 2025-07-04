// src/components/layouts/Layout.tsx
// Changed: Removed ChatInput from header with proper spacing
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import CitySelector from './CitySelector';
import { BottomNavigation } from './BottomNavigation';
// ChatInput is now in HeatmapHeader, no need to import here directly for MainNav

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  // Chat-specific props
  activeView?: 'ai' | 'community';
  setActiveView?: (view: 'ai' | 'community') => void;
  handleOpenUserDirectory?: () => void;
  setIsEventListSheetOpen?: (open: boolean) => void;
  newMessagesCount?: number;
  newEventsCount?: number;
  // Chat input props (now passed to HeatmapHeader)
  chatInputProps?: {
    input: string;
    setInput: (value: string) => void;
    handleSendMessage: () => void;
    isTyping: boolean;
    // Corrected prop name from handleKeyPress to onKeyDown
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    isHeartActive: boolean;
    handleHeartClick: () => void;
    globalQueries: any[];
    toggleRecentQueries: () => void;
    inputRef: React.RefObject<HTMLInputElement>;
    onAddEvent?: () => void;
    showAnimatedPrompts: boolean;
    activeChatModeValue: 'ai' | 'community';
    activeCategory?: string;
    onCategoryChange?: (category: string) => void;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  hideFooter = false,
  activeView,
  setActiveView,
  handleOpenUserDirectory,
  setIsEventListSheetOpen,
  newMessagesCount = 0,
  newEventsCount = 0,
  // chatInputProps is now passed directly to HeatmapHeader, not used in MainNav anymore
  // so we remove it from here if MainNav doesn't need it.
  // We keep it as a prop for Layout because Heatmap needs it.
  chatInputProps
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
  
  // Conditionally hide header for /heatmap and / (root)
  const hideHeader = pathname === '/heatmap' || pathname === '/';

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
      
      {!hideHeader && ( // Header wird nur angezeigt, wenn hideHeader false ist
        <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-sm border-b border-black">
          <div className="container flex h-16 items-center">
            {/* MainNav no longer needs chatInputProps directly here */}
            <MainNav pathname={pathname} activeView={activeView} /> 
            {(pathname !== '/chat' && pathname !== '/') && ( 
              <div className="ml-auto flex items-center space-x-4">
                <ThemeToggleButton />
              </div>
            )}
          </div>
        </header>
      )}
      
      {/* Passe das paddingTop des main-Elements an, wenn der Header ausgeblendet ist */}
      <main className={cn("pb-20", hideHeader ? "pt-0" : "pt-[104px]")}> 
        {children}
      </main>
      
      {/* Bottom Navigation for Chat and Root pages */}
      {(pathname === '/chat' || pathname === '/' || pathname === '/heatmap' || pathname === '/users' || pathname === '/events') && (
        <BottomNavigation
          activeView={activeView}
          setActiveView={setActiveView}
          handleOpenUserDirectory={handleOpenUserDirectory}
          setIsEventListSheetOpen={setIsEventListSheetOpen}
          newMessagesCount={newMessagesCount}
          newEventsCount={newEventsCount}
        />
      )}
      
      {!hideFooter && (
        <footer className="border-t border-black bg-black">
          <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
            <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
              <a href="/" className="flex items-center space-x-2">
                <span className="font-bold inline-block">THE TRIBE</span>
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
  // Removed chatInputProps from here as it's now handled by HeatmapHeader
  // chatInputProps?: any; 
  activeView?: 'ai' | 'community';
}

const MainNav: React.FC<MainNavProps> = ({ pathname, activeView }) => {
  // If we're on chat page or the root path, show header with THE TRIBE + city selector
  // The chat input is now directly in HeatmapHeader, so we remove it from here.
  if (pathname === '/chat' || pathname === '/') {
    return (
      <div className="flex items-center w-full gap-4">
        {/* Left side: THE TRIBE + City selector */}
        <div className="flex flex-col items-start flex-shrink-0">
          <Link to="/" className="flex items-center">
            <span className="font-bold inline-block">THE TRIBE</span>
          </Link>
          <CitySelector />
        </div>
        {/* ChatInput is no longer rendered here */}
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