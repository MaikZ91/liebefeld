// src/components/layouts/BottomNavigation.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MessageSquare, Map, User, Settings, LogOut, UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import OnboardingChatbot from '@/components/OnboardingChatbot';
import UserDirectory from '@/components/users/UserDirectory';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { getInitials } from '@/utils/chatUIUtils';

interface BottomNavigationProps {
  activeView?: 'ai' | 'community';
  setActiveView?: (view: 'ai' | 'community') => void;
  newMessagesCount: number;
  newEventsCount: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeView,
  setActiveView,
  newMessagesCount,
  newEventsCount
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnHeatmap = location.pathname === '/heatmap';
  const isOnEventsPage = location.pathname === '/events';
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isUserDirectoryOpen, setIsUserDirectoryOpen] = useState(false);

  // Check if user has completed onboarding
  const username = localStorage.getItem(USERNAME_KEY);
  const avatarUrl = localStorage.getItem(AVATAR_KEY);
  const hasCompletedOnboarding = username && username !== 'Anonymous' && username !== 'User' && username.trim().length > 0;

  // Logout functionality
  const handleLogout = () => {
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(AVATAR_KEY);
    localStorage.removeItem('selectedCityAbbr');
    localStorage.removeItem('selectedCityName');
    // Reload to trigger onboarding
    window.location.reload();
  };


  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-t border-gray-700 min-h-16">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {/* Community Chat Button */}
        <Button 
          variant={activeView === 'community' ? "default" : "ghost"} 
          size="sm" 
          onClick={() => {
            setActiveView?.('community');
            navigate('/chat?view=community');
          }} 
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-2 h-auto relative min-w-0",
            activeView === 'community' ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          {hasCompletedOnboarding ? (
            <Avatar className="h-4 w-4">
              <AvatarImage src={avatarUrl || undefined} alt={username || 'User'} />
              <AvatarFallback className="bg-red-500 text-white text-[8px]">
                {getInitials(username || 'User')}
              </AvatarFallback>
            </Avatar>
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          <span className="text-[10px]">Community Chat</span>
          {newMessagesCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-green-600 text-white h-4 w-4 flex items-center justify-center rounded-full text-[8px] p-0">
              {newMessagesCount}
            </Badge>
          )}
        </Button>

        {/* Heatmap Button */}
        <Button 
          variant={isOnHeatmap ? "default" : "ghost"} 
          size="sm" 
          onClick={() => navigate('/heatmap')} 
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-2 h-auto min-w-0",
            isOnHeatmap ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          <Map className="h-4 w-4" />
          <span className="text-[10px]">Social Map</span>
        </Button>

        {/* User/Welcome Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            if (!hasCompletedOnboarding) {
              setIsOnboardingOpen(true);
            } else {
              setIsUserDirectoryOpen(true);
            }
          }} 
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-2 h-auto min-w-0",
            !hasCompletedOnboarding 
              ? "text-red-500 hover:text-red-400" 
              : "text-gray-400 hover:text-white"
          )}
        >
          <User className="h-4 w-4" />
          <span className="text-[10px]">
            {hasCompletedOnboarding ? 'User' : 'Welcome'}
          </span>
        </Button>
        
        {/* Calendar Events Button */}
        <Button 
          variant={isOnEventsPage ? "default" : "ghost"} 
          size="sm" 
          onClick={() => navigate('/events')} 
          className={cn(
            "flex flex-col items-center gap-1 px-2 py-2 h-auto min-w-0",
            isOnEventsPage ? 'bg-red-500 hover:bg-red-600 text-white' : 'text-gray-400 hover:text-white'
          )}
        >
          <Calendar className="h-4 w-4" />
          <span className="text-[10px]">Event Calendar</span>
          {newEventsCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-green-600 text-white h-4 w-4 flex items-center justify-center rounded-full text-[8px] p-0">
              {newEventsCount}
            </Badge>
          )}
        </Button>
      </div>
      
      {/* Onboarding Chatbot */}
      <OnboardingChatbot 
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
        onComplete={() => {
          // Refresh page or trigger profile reload
          window.location.reload();
        }}
      />

      {/* User Directory */}
      <UserDirectory 
        open={isUserDirectoryOpen}
        onOpenChange={setIsUserDirectoryOpen}
        onSelectUser={() => {}} // Empty function since we don't need user selection in this context
      />
    </div>
  );
};