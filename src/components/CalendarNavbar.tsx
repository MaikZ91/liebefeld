
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays, Info, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const CalendarNavbar: React.FC = () => {
  const location = useLocation();
  const [city, setCity] = useState('BI');
  
  const links = [
    { href: '/', icon: CalendarDays, label: 'Kalender & Community' },
    { href: '/chat', icon: MessageSquare, label: 'Event Assistent' },
    { href: '/about', icon: Info, label: 'Über uns' },
  ];
  
  return (
    <header className="w-full bg-black py-4 text-white">
      <div className="container mx-auto px-4 flex flex-row justify-between items-center">
        <div className="flex items-center">
          <div className="flex items-baseline">
            <Link to="/" className="flex items-center">
              <h1 className="font-serif text-2xl font-bold tracking-tight">THE TRIBE</h1>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button
                    variant="ghost"
                    className="p-0 h-auto font-serif text-2xl font-bold tracking-tight text-white hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 hover:text-white active:bg-transparent"
                  >
                  .{city}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-red-500/30">
                <DropdownMenuItem onClick={() => setCity('BI')} className="text-white hover:bg-red-500/20 cursor-pointer focus:bg-red-500/20 focus:text-white">Bielefeld</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCity('HH')} className="text-white hover:bg-red-500/20 cursor-pointer focus:bg-red-500/20 focus:text-white">Hamburg</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Desktop navigation - now positioned next to the logo */}
          <nav className="hidden md:block ml-6">
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
                          : "hover:bg-gray-800"
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
        </div>
        
        {/* Mobile navigation */}
        <div className="md:hidden flex items-center">
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
                    : "text-white hover:bg-gray-800"
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
