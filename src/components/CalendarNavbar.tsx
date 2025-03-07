
import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays, Info, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from './ui/badge';

const CalendarNavbar: React.FC = () => {
  const location = useLocation();
  
  const links = [
    { href: '/', icon: CalendarDays, label: 'Kalender' },
    { href: '/groups', icon: Users, label: 'Gruppen' },
    { href: '/about', icon: Info, label: 'Über uns' },
  ];
  
  return (
    <header className="w-full bg-transparent py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <h1 className="font-serif text-2xl font-bold tracking-tight">THE TRIBE.BI</h1>
        </Link>
        
        <nav className="hidden md:block">
          <ul className="flex space-x-1">
            {links.map((link) => {
              const isActive = location.pathname === link.href || 
                               (link.href === '/about' && location.pathname === '/impressum');
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
                    {link.href === '/about' && location.pathname === '/impressum' && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">Impressum</Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="md:hidden flex items-center">
          {links.map((link) => {
            const isActive = location.pathname === link.href || 
                             (link.href === '/about' && location.pathname === '/impressum');
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
                {link.href === '/about' && location.pathname === '/impressum' && (
                  <Badge variant="secondary" className="ml-1 text-[8px] absolute -mt-1">Impressum</Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default CalendarNavbar;
