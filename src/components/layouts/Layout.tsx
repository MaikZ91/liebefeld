// src/components/layouts/Layout.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Calendar, Users, Info, BookOpen, ShieldCheck, Mail, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import ChatInput from '@/components/event-chat/ChatInput'; // Import ChatInput
import { cn } from '@/lib/utils'; // Import cn for conditional classnames

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  activeView?: 'ai' | 'community';
  setActiveView?: (view: 'ai' | 'community') => void;
  handleOpenUserDirectory?: () => void;
  setIsEventListSheetOpen?: (open: boolean) => void;
  newMessagesCount?: number;
  newEventsCount?: number;
  activeChatModeValue?: 'ai' | 'community'; // ADDED: Prop for active chat mode
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
  activeChatModeValue // ADDED: Destructure activeChatModeValue
}) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Startseite', path: '/', icon: Home },
    { name: 'Community Chat', path: '/chat', icon: MessageSquare, badge: newMessagesCount > 0 ? newMessagesCount : undefined },
    { name: 'Events', path: '/events', icon: Calendar, action: () => setIsEventListSheetOpen && setIsEventListSheetOpen(true), badge: newEventsCount > 0 ? newEventsCount : undefined },
    { name: 'Benutzer', path: '/users', icon: Users, action: handleOpenUserDirectory },
    { name: 'Social Map', path: '/heatmap', icon: Map },
    { name: 'Über Uns', path: '/about', icon: Info },
    { name: 'Impressum', path: '/impressum', icon: BookOpen },
    { name: 'Datenschutz', path: '/privacy', icon: ShieldCheck },
    { name: 'CSA-E Richtlinien', path: '/policies', icon: ShieldCheck },
    { name: 'Kontakt', path: 'mailto:info@liebefeld.ch', icon: Mail },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/chat';
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full border-b bg-black text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Liebefeld Logo" className="h-8 mr-2" />
            <span className="text-xl font-bold">Liebefeld</span>
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => (
            <React.Fragment key={item.name}>
              {item.action ? (
                <Button variant="ghost" onClick={item.action} className={cn("text-white hover:text-red-500", { "text-red-500": isActive(item.path) })}>
                  <item.icon className="h-5 w-5 mr-1" />
                  {item.name}
                  {item.badge && <Badge variant="destructive" className="ml-1">{item.badge}</Badge>}
                </Button>
              ) : (
                <Button asChild variant="ghost" className={cn("text-white hover:text-red-500", { "text-red-500": isActive(item.path) })}>
                  <Link to={item.path}>
                    <item.icon className="h-5 w-5 mr-1" />
                    {item.name}
                    {item.badge && <Badge variant="destructive" className="ml-1">{item.badge}</Badge>}
                  </Link>
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Home className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px] bg-black text-white">
              <nav className="flex flex-col gap-4 py-6">
                {navItems.map((item) => (
                  <React.Fragment key={item.name}>
                    {item.action ? (
                      <Button variant="ghost" onClick={item.action} className={cn("justify-start text-white hover:text-red-500", { "text-red-500": isActive(item.path) })}>
                        <item.icon className="h-5 w-5 mr-2" />
                        {item.name}
                        {item.badge && <Badge variant="destructive" className="ml-auto">{item.badge}</Badge>}
                      </Button>
                    ) : (
                      <Button asChild variant="ghost" className={cn("justify-start text-white hover:text-red-500", { "text-red-500": isActive(item.path) })}>
                        <Link to={item.path}>
                          <item.icon className="h-5 w-5 mr-2" />
                          {item.name}
                          {item.badge && <Badge variant="destructive" className="ml-auto">{item.badge}</Badge>}
                        </Link>
                      </Button>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="flex-grow">
        {children}
      </main>
      {!hideFooter && (
        <footer className="w-full border-t bg-black text-white p-4 text-center text-sm">
          © 2023 Liebefeld. Alle Rechte vorbehalten.
        </footer>
      )}
      {/* Render ChatInput directly, passing activeChatModeValue */}
      {activeChatModeValue && ( // Ensure activeChatModeValue is present before rendering
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black p-2 md:p-4">
          <ChatInput activeChatModeValue={activeChatModeValue} />
        </div>
      )}
    </div>
  );
};