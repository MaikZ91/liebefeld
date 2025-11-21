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
import { Calendar, MessageSquare, Map, User, Settings, LogOut, UserIcon, Target } from 'lucide-react';
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
  const isOnChallengePage = location.pathname === '/challenge';
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
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center lov-bottom-nav">
      <div className="flex items-center gap-2 bg-black/70 backdrop-blur-xl rounded-2xl px-3 py-1.5 border border-white/20 shadow-2xl shadow-black/50">
          {/* Community Chat Button */}
          <Button 
            variant="ghost"
            size="icon" 
onClick={() => {
              console.log('🔥 [BottomNav] Community Chat button clicked');
              // Always open the Community Chat overlay on the Heatmap for consistent design
              if (window.location.pathname === '/heatmap') {
                window.dispatchEvent(new CustomEvent('toggle-community-chat'));
              } else {
                navigate('/heatmap');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('toggle-community-chat'));
                }, 120);
              }
            }}
            className={cn(
              "relative h-9 w-9 rounded-xl transition-all duration-300",
              activeView === 'community' 
                ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            )}
          >
            {hasCompletedOnboarding ? (
              <Avatar className="h-6 w-6">
                <AvatarImage src={avatarUrl || undefined} alt={username || 'User'} />
                <AvatarFallback className="bg-primary text-white text-xs">
                  {getInitials(username || 'User')}
                </AvatarFallback>
              </Avatar>
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            {newMessagesCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-gradient-to-br from-green-400 to-emerald-500 text-white h-5 w-5 flex items-center justify-center rounded-full text-[10px] p-0 border border-white/20 shadow-lg animate-pulse">
                {newMessagesCount}
              </Badge>
            )}
          </Button>

          {/* Heatmap Button */}
          <Button 
            variant="ghost"
            size="icon" 
            onClick={() => navigate('/heatmap')} 
            className={cn(
              "h-9 w-9 rounded-xl transition-all duration-300",
              isOnHeatmap 
                ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            )}
          >
            <Map className="h-4 w-4" />
          </Button>

          {/* Event Calendar Button */}
          <Button 
            variant="ghost"
            size="icon" 
            onClick={() => {
              console.log('🔥 [BottomNav] Event Calendar button clicked');
              // Check if we're on the heatmap page
              if (window.location.pathname === '/heatmap') {
                // Trigger event list in heatmap
                window.dispatchEvent(new CustomEvent('toggle-event-list'));
              } else {
                // Navigate to heatmap and show event list
                navigate('/heatmap');
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('toggle-event-list'));
                }, 100);
              }
            }}
            className={cn(
              "relative h-9 w-9 rounded-xl transition-all duration-300",
              isOnEventsPage 
                ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            )}
          >
            <Calendar className="h-4 w-4" />
            {newEventsCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-gradient-to-br from-green-400 to-emerald-500 text-white h-5 w-5 flex items-center justify-center rounded-full text-[10px] p-0 border border-white/20 shadow-lg animate-pulse">
                {newEventsCount}
              </Badge>
            )}
          </Button>

          {/* User/Welcome Button */}
          <Button 
            variant="ghost"
            size="icon" 
            onClick={() => {
              if (!hasCompletedOnboarding) {
                setIsOnboardingOpen(true);
              } else {
                setIsUserDirectoryOpen(true);
              }
            }} 
            className={cn(
              "h-9 w-9 rounded-xl transition-all duration-300",
              !hasCompletedOnboarding 
                ? "text-primary hover:text-primary-foreground hover:bg-primary/20" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <User className="h-4 w-4" />
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