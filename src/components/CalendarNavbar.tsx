import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays, Info, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import CategorySelector from './CategorySelector';

const CalendarNavbar: React.FC = () => {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('alle');
  
  const links = [
    { href: '/', icon: CalendarDays, label: 'Kalender & Community' },
    { href: '/chat', icon: MessageSquare, label: 'Event Assistent' },
    { href: '/about', icon: Info, label: 'Über uns' },
  ];

  const categories = [
    { id: 'alle', label: 'Alle' },
    { id: 'sport', label: 'Sport' },
    { id: 'ausgehen', label: 'Ausgehen' },
    { id: 'kreativität', label: 'Kreativität' },
    { id: 'musik', label: 'Musik' },
    { id: 'kunst', label: 'Kunst' },
  ];
  
  return (
    <header className="w-full bg-black text-white">
      {/* Main navigation bar */}
      <div className="py-4">
        <div className="container mx-auto px-4 flex flex-row justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-baseline">
              <Link to="/" className="flex items-center">
                <h1 className="font-serif text-2xl font-bold tracking-tight">THE TRIBE</h1>
              </Link>
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
      </div>
      
      {/* Category selector - Spotify style */}
      <div className="border-t border-white/10 py-3">
        <div className="container mx-auto px-4">
          <CategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            className="max-w-full"
          />
        </div>
      </div>
    </header>
  );
};

export default CalendarNavbar;
