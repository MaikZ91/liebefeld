import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ViewState, TribeEvent, Post, UserProfile } from '@/types/tribe';
import { convertToTribeEvent } from '@/utils/tribe/eventHelpers';
import { TribeEventCard } from './TribeEventCard';
import { TribeAIChat } from './TribeAIChat';
import { TribeCommunityBoard } from './TribeCommunityBoard';
import { TribeMapView } from './TribeMapView';
import { 
  Map as MapIcon,
  Home,
  Users,
  Sparkles,
  ChevronDown
} from 'lucide-react';

const CITIES = ['Bielefeld', 'Berlin', 'Hamburg', 'Köln', 'München'];
const CATEGORIES = ['ALL', 'PARTY', 'ART', 'CONCERT', 'SPORT'];

export const TribeApp: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.FEED);
  const [selectedCity, setSelectedCity] = useState<string>('Bielefeld');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);
  
  const [allEvents, setAllEvents] = useState<TribeEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [userProfile] = useState<UserProfile>({
    username: localStorage.getItem('username') || 'Mia',
    bio: 'Observer',
    avatarUrl: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
    avatar: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png'
  });

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

  const filteredEvents = useMemo(() => {
    let result = allEvents.filter(e => e.city === selectedCity);
    if (selectedCategory !== 'ALL') {
        result = result.filter(e => e.category?.toUpperCase() === selectedCategory);
    }
    return result;
  }, [allEvents, selectedCity, selectedCategory]);

  const spotlightEvents = filteredEvents.slice(0, 5);
  const feedEvents = filteredEvents.slice(5);

  const handleJoinCrew = (eventName: string) => {
      const newPost: Post = {
          id: Date.now().toString(),
          user: userProfile.username,
          text: `Who is going to "${eventName}"? Looking for a crew!`,
          city: selectedCity,
          likes: 0,
          time: 'Just now',
          tags: ['CrewCall'],
          userAvatar: userProfile.avatarUrl
      };
      setPosts([newPost, ...posts]);
      setView(ViewState.COMMUNITY);
  };

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
             <span className="text-sm font-extrabold tracking-[0.25em] text-white">THE TRIBE</span>
        </div>

        {/* CITY SELECTOR */}
        <div className="relative">
            <button 
                onClick={() => setIsCityMenuOpen(!isCityMenuOpen)} 
                className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-zinc-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5"
            >
                {selectedCity}
                <ChevronDown size={12} className={`transition-transform duration-300 ${isCityMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isCityMenuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-zinc-900 border border-white/10 min-w-[160px] z-50 shadow-2xl animate-fadeIn">
                    {CITIES.map(city => (
                        <button 
                            key={city} 
                            onClick={() => { setSelectedCity(city); setIsCityMenuOpen(false); }} 
                            className="block w-full text-right px-4 py-3 text-[10px] font-bold uppercase text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            {city}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-20 px-0 max-w-2xl mx-auto min-h-screen">

        {view === ViewState.FEED && (
          <div className="animate-fadeIn">
            {/* Categories */}
            <div className="px-6 mb-8 flex gap-8 overflow-x-auto no-scrollbar border-b border-white/5 pb-4">
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)}
                        className={`
                            text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap transition-colors
                            ${selectedCategory === cat ? 'text-gold' : 'text-zinc-600 hover:text-zinc-400'}
                        `}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Spotlight */}
            {spotlightEvents.length > 0 && (
              <div className="mb-12">
                  <div className="px-6 mb-4">
                      <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Featured</h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-6 pb-4">
                      {spotlightEvents.map((event, i) => (
                          <div key={`spot-${i}`} className="min-w-[75vw] md:min-w-[340px] snap-center">
                              <TribeEventCard event={event} variant="hero" />
                          </div>
                      ))}
                  </div>
              </div>
            )}

            {/* Feed List */}
            <div className="px-6 space-y-2 pb-12">
                <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-4 mb-4">Upcoming</h2>
                {feedEvents.length > 0 ? (
                    feedEvents.map((event, i) => (
                        <div key={i}>
                             <TribeEventCard event={event} variant="standard" onJoinCrew={handleJoinCrew} />
                        </div>
                    ))
                ) : (
                    <div className="py-10 text-center text-zinc-600 font-light text-sm">
                        No events in this sector.
                    </div>
                )}
            </div>
          </div>
        )}

        {view === ViewState.TRIBE_AI && <TribeAIChat onClose={() => setView(ViewState.FEED)} events={filteredEvents} />}
        {view === ViewState.COMMUNITY && <TribeCommunityBoard selectedCity={selectedCity} userProfile={userProfile} posts={posts} onPostsChange={setPosts} />}
        {view === ViewState.MAP && (
            <div className="absolute inset-0 pt-16 h-[calc(100vh-80px)]">
                 <TribeMapView events={filteredEvents} posts={posts} selectedCity={selectedCity} />
            </div>
        )}

      </main>

      {/* --- BOTTOM NAVIGATION --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 border-t border-white/10 px-6 py-2 flex justify-between items-center max-w-2xl mx-auto w-full backdrop-blur-lg">
          <button onClick={() => setView(ViewState.FEED)} className={`flex flex-col items-center gap-1 p-2 ${view === ViewState.FEED ? 'text-white' : 'text-zinc-600'}`}>
              <Home size={20} strokeWidth={1.5} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Home</span>
          </button>

          <button onClick={() => setView(ViewState.MAP)} className={`flex flex-col items-center gap-1 p-2 ${view === ViewState.MAP ? 'text-white' : 'text-zinc-600'}`}>
              <MapIcon size={20} strokeWidth={1.5} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Map</span>
          </button>

          <button onClick={() => setView(ViewState.COMMUNITY)} className={`flex flex-col items-center gap-1 p-2 ${view === ViewState.COMMUNITY ? 'text-white' : 'text-zinc-600'}`}>
              <Users size={20} strokeWidth={1.5} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Tribe</span>
          </button>

          <button onClick={() => setView(ViewState.TRIBE_AI)} className={`flex flex-col items-center gap-1 p-2 ${view === ViewState.TRIBE_AI ? 'text-gold' : 'text-zinc-600'}`}>
              <Sparkles size={20} strokeWidth={1.5} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Nexus</span>
          </button>
      </nav>

    </div>
  );
};