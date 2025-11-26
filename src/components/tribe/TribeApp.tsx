import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ViewState, TribeEvent, Post, UserProfile } from '@/types/tribe';
import { convertToTribeEvent } from '@/utils/tribe/eventHelpers';
import { TribeEventCard } from './TribeEventCard';
import { TribeAIChat } from './TribeAIChat';
import { TribeCommunityBoard } from './TribeCommunityBoard';
import { TribeMapView } from './TribeMapView';
import { TribeBottomNav } from './TribeBottomNav';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';

export const TribeApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.FEED);
  const [events, setEvents] = useState<TribeEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCity, setSelectedCity] = useState('Bielefeld');
  const [showAI, setShowAI] = useState(false);
  
  const [userProfile] = useState<UserProfile>({
    username: localStorage.getItem('username') || 'User',
    bio: 'THE TRIBE Member',
    avatarUrl: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
  });

  useEffect(() => {
    loadEvents();
    loadPosts();
  }, [selectedCity]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .eq('city', selectedCity)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(50);

      if (error) throw error;
      
      const tribeEvents = (data || []).map(convertToTribeEvent);
      setEvents(tribeEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadPosts = () => {
    const mockPosts: Post[] = [
      {
        id: '1',
        user: 'Sarah_M',
        text: 'Who\'s hitting the Jazz Night at Ringlokschuppen tonight? 🎷',
        city: selectedCity,
        likes: 12,
        time: '2h ago',
        tags: ['jazz', 'ausgehen'],
        userAvatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
        comments: [],
      },
    ];
    setPosts(mockPosts);
  };

  const handleEventClick = (event: TribeEvent) => {
    console.log('Event clicked:', event);
  };

  const handleJoinCrew = (eventName: string) => {
    console.log('Joining crew for:', eventName);
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.FEED:
        return (
          <ScrollArea className="h-full">
            <div className="pb-20">
              {/* Header */}
              <header className="bg-black/95 backdrop-blur-lg border-b border-white/10 sticky top-0 z-30 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-white text-xl font-light tracking-tight">THE TRIBE</h1>
                    <p className="text-zinc-600 text-xs font-light uppercase tracking-widest">Tonight in {selectedCity}</p>
                  </div>
                  <button
                    onClick={() => setShowAI(true)}
                    className="bg-gold hover:bg-gold/80 text-black rounded-full p-2.5 transition-colors"
                  >
                    <Sparkles size={18} />
                  </button>
                </div>
              </header>

              {/* Hero Event */}
              {events.length > 0 && (
                <div className="mb-6">
                  <TribeEventCard 
                    event={events[0]} 
                    variant="hero"
                    onClick={() => handleEventClick(events[0])}
                    onJoinCrew={handleJoinCrew}
                  />
                </div>
              )}

              {/* More Events */}
              <div className="px-5 space-y-6">
                <h2 className="text-white text-sm font-light uppercase tracking-widest">More Events</h2>
                {events.slice(1).map((event) => (
                  <TribeEventCard 
                    key={event.id} 
                    event={event} 
                    variant="standard"
                    onClick={() => handleEventClick(event)}
                    onJoinCrew={handleJoinCrew}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        );

      case ViewState.TRIBE_AI:
        return (
          <TribeAIChat 
            onClose={() => setCurrentView(ViewState.FEED)}
            events={events}
          />
        );

      case ViewState.COMMUNITY:
        return (
          <TribeCommunityBoard
            selectedCity={selectedCity}
            userProfile={userProfile}
            posts={posts}
            onPostsChange={setPosts}
          />
        );

      case ViewState.MAP:
        return (
          <TribeMapView 
            events={events}
            onEventClick={handleEventClick}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {renderView()}
      
      {showAI && (
        <TribeAIChat 
          onClose={() => setShowAI(false)}
          events={events}
        />
      )}
      
      <TribeBottomNav 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
    </div>
  );
};
