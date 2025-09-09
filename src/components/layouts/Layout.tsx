// src/components/layouts/Layout.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import CitySelector from './CitySelector';
import { BottomNavigation } from './BottomNavigation'; // Ensure BottomNavigation is imported
import ChatInput from '@/components/event-chat/ChatInput'; // Ensure ChatInput is imported
import UserProfileButton from '@/components/UserProfileButton';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  activeView?: 'ai' | 'community';
  setActiveView?: (view: 'ai' | 'community') => void;
  handleOpenUserDirectory?: () => void;
  setIsEventListSheetOpen?: (open: boolean) => void;
  newMessagesCount?: number;
  newEventsCount?: number;
  chatInputProps?: {
    input: string;
    setInput: (value: string) => void;
    handleSendMessage: (input?: string) => Promise<void>;
    isTyping: boolean;
    onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    isHeartActive: boolean;
    handleHeartClick: () => void;
    globalQueries: any[];
    toggleRecentQueries: () => void;
    inputRef: React.RefObject<HTMLTextAreaElement>;
    onAddEvent?: () => void;
    showAnimatedPrompts: boolean;
    activeCategory?: string;
    onCategoryChange?: (category: string) => void;
    onJoinEventChat?: (eventId: string, eventTitle: string) => void;
    onCreatePoll?: (poll: { question: string; options: string[] }) => void;
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
  chatInputProps
}) => {
  const { pathname } = useLocation();
  
  const [isAddEventModalOpen, setIsAddEventModalOpen] = React.useState(false); // Correct and consistent naming
  
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
  
  const hideHeader = pathname === '/heatmap' || pathname === '/' || pathname === '/events' || pathname === '/chat';

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
      
      {!hideHeader && (
        <header className="sticky top-0 z-50 w-full">
          {/* Curved black header bar with THE TRIBE logo - matching Heatmap design */}
          <div className="relative">
            <div className="bg-black mx-4 px-6 py-4 relative rounded-bl-[2rem] flex items-center justify-between">
              {/* MainNav and other header elements */}
              <MainNav pathname={pathname} chatInputProps={chatInputProps} activeView={activeView} />
              <div className="flex items-center space-x-4">
                <UserProfileButton />
                {(pathname !== '/chat' && pathname !== '/') && <ThemeToggleButton />}
              </div>
            </div>
          </div>
          
          {/* REMOVED: Black search bar for Chat Input from here */}
          {/* It will now be moved above the BottomNavigation */}
        </header>
      )}
      
      <main className={cn("pb-16", hideHeader ? "pt-0" : chatInputProps && (pathname === '/chat' || pathname === '/') ? "pt-32" : "pt-[104px]")}>  
        {children}
      </main>
      
      {/* NEW: Chat Input directly above BottomNavigation */}
      {/* Conditionally render ChatInput only on /chat or / and when activeView is 'community' */}
      {chatInputProps && (pathname === '/chat' || pathname === '/') && activeView === 'community' && (
        <div className="fixed bottom-16 left-0 right-0 z-50 px-4 pb-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-black rounded-full border border-gray-700/50 mx-2">
            <ChatInput
              input={chatInputProps.input}
              setInput={chatInputProps.setInput}
              handleSendMessage={chatInputProps.handleSendMessage}
              isTyping={chatInputProps.isTyping}
              onKeyDown={chatInputProps.onKeyDown}
              isHeartActive={chatInputProps.isHeartActive}
              handleHeartClick={chatInputProps.handleHeartClick}
              globalQueries={chatInputProps.globalQueries}
              toggleRecentQueries={chatInputProps.toggleRecentQueries}
              inputRef={chatInputProps.inputRef}
              onAddEvent={chatInputProps.onAddEvent}
              showAnimatedPrompts={chatInputProps.showAnimatedPrompts}
              activeChatModeValue={activeView || 'ai'} // Ensures the correct mode is passed
              activeCategory={chatInputProps.activeCategory}
              onCategoryChange={chatInputProps.onCategoryChange}
              onChange={chatInputProps.onChange}
              onJoinEventChat={chatInputProps.onJoinEventChat}
              onCreatePoll={chatInputProps.onCreatePoll}
              placeholder={activeView === 'community' ? "Chatte in der Community" : "Frage nach Events..."}
            />
          </div>
        </div>
      )}

      {(pathname === '/chat' || pathname === '/' || pathname === '/heatmap' || pathname === '/users' || pathname === '/events') && (
        <BottomNavigation
          activeView={activeView}
          setActiveView={setActiveView}
          newMessagesCount={newMessagesCount}
          newEventsCount={newEventsCount}
        />
      )}
      
      {!hideFooter && (
        <footer className="border-t border-black bg-black">
          <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
            <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
              <a href="/" className="flex items-center space-x-2">
                <span className="font-sans text-2xl font-bold tracking-tight text-white inline-block">THE TRIBE</span> {/* Ensured consistent styling */}
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
  chatInputProps?: any;
  activeView?: 'ai' | 'community';
}

const MainNav: React.FC<MainNavProps> = ({ pathname, chatInputProps, activeView }) => {
  if (pathname === '/chat') {
    // No header for chat page to give more space to community chat
    return null;
  }
  
  if (pathname === '/') {
    return (
      <div className="flex items-center gap-4 relative z-10">
        <Link to="/" className="flex items-center">
          <h1 className="font-sans text-2xl font-bold tracking-tight text-red-500">THE TRIBE</h1>
        </Link>
        <CitySelector />
      </div>
    );
  }
  
  return (
    <div className="mr-4 flex">
      <Link to="/" className="mr-6 flex items-center space-x-2">
        <span className="font-sans text-2xl font-bold tracking-tight text-white inline-block">THE TRIBE</span> {/* Ensured consistent styling */}
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