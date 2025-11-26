import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ViewState, TribeEvent, Post, UserProfile } from '@/types/tribe';
import { convertToTribeEvent } from '@/utils/tribe/eventHelpers';
import { TribeEventCard } from './TribeEventCard';
import { TribeAIChat } from './TribeAIChat';
import { TribeCommunityBoard } from './TribeCommunityBoard';
import { TribeMapView } from './TribeMapView';
import { Home, Sparkles, Users, Map } from 'lucide-react';

export const TribeApp: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.FEED);
  const [allEvents, setAllEvents] = useState<TribeEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCity, setSelectedCity] = useState('Bielefeld');
  const [showAI, setShowAI] = useState(false);
  const [filterMode, setFilterMode] = useState<'TODAY' | 'TOMORROW'>('TODAY');
  
  const [userProfile] = useState<UserProfile>({
    username: localStorage.getItem('username') || 'User',
    bio: 'THE TRIBE Member',
    avatarUrl: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
  });

  const cityOptions = ['Bielefeld', 'Berlin', 'Hamburg', 'München', 'Köln'];

  useEffect(() => {
    fetchEvents();
    loadPosts();
  }, [selectedCity]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .eq('city', selectedCity)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(100);

      if (error) throw error;
      
      const tribeEvents = (data || []).map(convertToTribeEvent);
      setAllEvents(tribeEvents);
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

  const handleJoinCrew = (eventName: string) => {
    console.log('Joining crew for:', eventName);
  };

  // Filter events by date
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const targetDate = filterMode === 'TODAY' ? today : tomorrow;
  const filteredEvents = allEvents.filter(e => e.date.startsWith(targetDate));

  return (
    <div className="min-h-screen bg-black text-white pb-24 overflow-x-hidden relative font-sans selection:bg-gold selection:text-black">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center max-w-2xl mx-auto">
        {/* THE TRIBE LOGO */}
        <div className="flex items-center gap-3">
             <div className="relative w-6 h-6">
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 22H22L12 2Z" className="fill-white"/>
                    <circle cx="12" cy="14" r="3" className="fill-black"/>
                </svg>
             </div>
            <div>
                <h1 className="text-white text-base font-light tracking-tight uppercase">THE TRIBE</h1>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Tonight in {selectedCity}</p>
            </div>
        </div>

        {/* City Selector */}
        <div className="relative">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-zinc-900 border border-white/10 text-white text-xs px-3 py-1.5 rounded appearance-none cursor-pointer hover:bg-zinc-800 transition-colors pr-8"
          >
            {cityOptions.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* AI Button */}
        <button
          onClick={() => setShowAI(true)}
          className="bg-gold hover:bg-gold/80 text-black rounded-full p-2 transition-colors"
        >
          <Sparkles size={16} />
        </button>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-20 flex-1 overflow-hidden relative">
        {view === ViewState.FEED && (
          <div className="h-full overflow-y-auto pb-20">
            {/* Hero Event */}
            {filteredEvents.length > 0 && (
              <div className="mb-6">
                <TribeEventCard 
                  event={filteredEvents[0]} 
                  variant="hero"
                  onJoinCrew={handleJoinCrew}
                />
              </div>
            )}

            {/* Date Filter */}
            <div className="px-5 mb-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilterMode('TODAY')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest flex-1 transition-colors ${
                    filterMode === 'TODAY' 
                      ? 'bg-white text-black' 
                      : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                  }`}
                >
                  Today
                </button>
                <button 
                  onClick={() => setFilterMode('TOMORROW')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest flex-1 transition-colors ${
                    filterMode === 'TOMORROW' 
                      ? 'bg-white text-black' 
                      : 'bg-white/10 text-zinc-400 hover:bg-white/20'
                  }`}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            {/* More Events */}
            <div className="px-5 space-y-6">
              <h2 className="text-white text-sm font-light uppercase tracking-widest">
                More Events
              </h2>
              {filteredEvents.slice(1).map((event) => (
                <TribeEventCard 
                  key={event.id} 
                  event={event} 
                  variant="standard"
                  onJoinCrew={handleJoinCrew}
                />
              ))}
            </div>
          </div>
        )}

        {view === ViewState.TRIBE_AI && (
          <TribeAIChat 
            onClose={() => setView(ViewState.FEED)}
            events={allEvents}
          />
        )}

        {view === ViewState.COMMUNITY && (
          <TribeCommunityBoard
            selectedCity={selectedCity}
            userProfile={userProfile}
            posts={posts}
            onPostsChange={setPosts}
          />
        )}

        {view === ViewState.MAP && (
          <div className="absolute inset-0 h-full">
            <TribeMapView 
              events={filteredEvents}
              posts={posts}
              selectedCity={selectedCity}
              onEventClick={(e) => console.log('Event clicked:', e)}
            />
          </div>
        )}
      </main>

      {/* --- AI OVERLAY --- */}
      {showAI && (
        <TribeAIChat 
          onClose={() => setShowAI(false)}
          events={allEvents}
        />
      )}

      {/* --- BOTTOM NAVIGATION --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t border-white/10 px-6 py-2 flex justify-between items-center max-w-2xl mx-auto w-full backdrop-blur-lg">
        <button 
          onClick={() => setView(ViewState.FEED)} 
          className={`flex flex-col items-center gap-1 p-2 ${
            view === ViewState.FEED ? 'text-white' : 'text-zinc-600'
          }`}
        >
          <Home size={20} strokeWidth={1.5} />
          <span className="text-[9px] font-medium uppercase tracking-wider">Home</span>
        </button>

        <button 
          onClick={() => setView(ViewState.TRIBE_AI)} 
          className={`flex flex-col items-center gap-1 p-2 ${
            view === ViewState.TRIBE_AI ? 'text-white' : 'text-zinc-600'
          }`}
        >
          <Sparkles size={20} strokeWidth={1.5} />
          <span className="text-[9px] font-medium uppercase tracking-wider">Tribe AI</span>
        </button>

        <button 
          onClick={() => setView(ViewState.COMMUNITY)} 
          className={`flex flex-col items-center gap-1 p-2 ${
            view === ViewState.COMMUNITY ? 'text-white' : 'text-zinc-600'
          }`}
        >
          <Users size={20} strokeWidth={1.5} />
          <span className="text-[9px] font-medium uppercase tracking-wider">Community</span>
        </button>

        <button 
          onClick={() => setView(ViewState.MAP)} 
          className={`flex flex-col items-center gap-1 p-2 ${
            view === ViewState.MAP ? 'text-white' : 'text-zinc-600'
          }`}
        >
          <Map size={20} strokeWidth={1.5} />
          <span className="text-[9px] font-medium uppercase tracking-wider">Map</span>
        </button>
      </nav>
    </div>
  );
};
