
import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays, Info, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
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
