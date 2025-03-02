
import React from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays, Users, Info } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const CalendarNavbar: React.FC = () => {
  const location = useLocation();
  
  const links = [
    { href: '/', icon: CalendarDays, label: 'Kalender' },
    { href: '/community', icon: Users, label: 'Community' },
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
        
        <div className="md:hidden flex">
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
