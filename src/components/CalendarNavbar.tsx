
import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays, Info, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import InstagramFeed from './InstagramFeed';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { QrCode } from 'lucide-react';

const CalendarNavbar: React.FC = () => {
  const location = useLocation();
  
  const links = [
    { href: '/', icon: CalendarDays, label: 'Kalender' },
    { href: '/groups', icon: Users, label: 'Gruppen' },
    { href: '/about', icon: Info, label: 'Über uns' },
  ];
  
  return (
    <header className="w-full bg-transparent py-4">
      <div className="container mx-auto px-4 flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex flex-col">
          <Link to="/" className="flex items-center">
            <h1 className="font-serif text-2xl font-bold tracking-tight">THE TRIBE.BI</h1>
          </Link>
          
          <div className="flex items-center gap-3 mt-2">
            <InstagramFeed />
            
            <a 
              href="https://drive.google.com/uc?export=download&id=1Fn3mG9AT4dEPKR37nfVt6IdyIbukeWJr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <Button 
                className="bg-[#a4c639] hover:bg-[#8baa30] text-white rounded-full h-10 w-10 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                size="icon"
              >
                <img 
                  src="/lovable-uploads/4a08308d-0a6d-4114-b820-f511ce7d7a65.png" 
                  alt="Android App" 
                  className="h-7 w-7"
                />
              </Button>
            </a>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  className="bg-[#F97316] hover:bg-orange-600 text-white rounded-full h-10 w-10 p-0 flex items-center justify-center shadow-lg hover:shadow-xl transition-all relative"
                  size="icon"
                >
                  <QrCode className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 text-[8px] bg-white text-orange-700 rounded-full px-1 py-0.5 font-bold animate-pulse-soft">QR</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4">
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg mb-2">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://liebefeld.lovable.app/`}
                      alt="QR Code für Liebefeld App"
                      width={150}
                      height={150}
                    />
                  </div>
                  <p className="text-xs text-center">Besuche unsere Webseite</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <nav className="hidden md:block mt-4 md:mt-0">
          <ul className="flex space-x-1">
            {links.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={cn(
                      "flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    )}
                  >
                    <link.icon className="h-4 w-4 mr-2" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="md:hidden flex items-center mt-4">
          {links.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "p-2 rounded-full",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-secondary"
                )}
              >
                <link.icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default CalendarNavbar;
