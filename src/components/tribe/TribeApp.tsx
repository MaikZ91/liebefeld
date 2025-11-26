import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ViewState, TribeEvent, Post, UserProfile, NexusFilter } from '@/types/tribe';
import { convertToTribeEvent } from '@/utils/tribe/eventHelpers';
import { TribeEventCard } from './TribeEventCard';
import { TribeAIChat } from './TribeAIChat';
import { TribeCommunityBoard } from './TribeCommunityBoard';
import { TribeMapView } from './TribeMapView';
import { AuthScreen } from './AuthScreen';
import { ProfileView } from './ProfileView';
import { 
  Map as MapIcon,
  Home,
  Users,
  Sparkles,
  ChevronDown,
  User,
  Send,
  X,
  Filter,
  LayoutList,
  LayoutTemplate
} from 'lucide-react';

const CITIES = ['Bielefeld', 'Berlin', 'Hamburg', 'Köln', 'München'];
const CATEGORIES = ['ALL', 'PARTY', 'ART', 'CONCERT', 'SPORT'];

export const TribeApp: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.FEED);
  const [selectedCity, setSelectedCity] = useState<string>('Bielefeld');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  
  // Event tracking state
  const [hiddenEventIds, setHiddenEventIds] = useState<Set<string>>(new Set());
  const [likedEventIds, setLikedEventIds] = useState<Set<string>>(new Set());
  const [attendingEventIds, setAttendingEventIds] = useState<Set<string>>(new Set());
  
  // Nexus state
  const [nexusInput, setNexusInput] = useState('');
  const [nexusInsight, setNexusInsight] = useState<string | null>(null);
  const [isNexusThinking, setIsNexusThinking] = useState(false);
  const [nexusFilter, setNexusFilter] = useState<NexusFilter | null>(null);
  
  // Query history
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  
  const [allEvents, setAllEvents] = useState<TribeEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Initialize auth and preferences
  useEffect(() => {
    const savedProfile = localStorage.getItem('tribe_user_profile');
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setUserProfile(parsedProfile);
      if (parsedProfile.homebase) setSelectedCity(parsedProfile.homebase);
    }

    const savedLikes = localStorage.getItem('tribe_liked_events');
    const savedHidden = localStorage.getItem('tribe_hidden_events');
    const savedAttending = localStorage.getItem('tribe_attending_events');
    const savedHistory = localStorage.getItem('tribe_query_history');
    
    if (savedLikes) setLikedEventIds(new Set(JSON.parse(savedLikes)));
    if (savedHidden) setHiddenEventIds(new Set(JSON.parse(savedHidden)));
    if (savedAttending) setAttendingEventIds(new Set(JSON.parse(savedAttending)));
    if (savedHistory) setQueryHistory(JSON.parse(savedHistory));
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('tribe_liked_events', JSON.stringify(Array.from(likedEventIds)));
  }, [likedEventIds]);

  useEffect(() => {
    localStorage.setItem('tribe_hidden_events', JSON.stringify(Array.from(hiddenEventIds)));
  }, [hiddenEventIds]);

  useEffect(() => {
    localStorage.setItem('tribe_attending_events', JSON.stringify(Array.from(attendingEventIds)));
  }, [attendingEventIds]);

  useEffect(() => {
    localStorage.setItem('tribe_query_history', JSON.stringify(queryHistory));
  }, [queryHistory]);

  useEffect(() => {
    if (userProfile) {
      fetchEvents();
      loadPosts();
    }
  }, [selectedCity, userProfile]);

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
    
    // Remove hidden events
    result = result.filter(e => !hiddenEventIds.has(e.id));
    
    // Filter by category
    if (selectedCategory !== 'ALL') {
        result = result.filter(e => e.category?.toUpperCase() === selectedCategory);
    }
    
    // Apply Nexus filter if active
    if (nexusFilter) {
      if (nexusFilter.category) {
        result = result.filter(e => e.category?.toLowerCase().includes(nexusFilter.category!.toLowerCase()));
      }
      if (nexusFilter.vibe) {
        result = result.filter(e => e.vibe === nexusFilter.vibe);
      }
      if (nexusFilter.date) {
        result = result.filter(e => e.date === nexusFilter.date);
      }
    }
    
    // Sort: Liked events first, then by date
    result.sort((a, b) => {
      const isLikedA = likedEventIds.has(a.id);
      const isLikedB = likedEventIds.has(b.id);
      
      if (isLikedA && !isLikedB) return -1;
      if (!isLikedA && isLikedB) return 1;
      
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    return result;
  }, [allEvents, selectedCity, selectedCategory, hiddenEventIds, likedEventIds, nexusFilter]);

  const spotlightEvents = filteredEvents.slice(0, 5);
  const feedEvents = filteredEvents.slice(5);

  const handleLogin = (profile: UserProfile) => {
    setUserProfile(profile);
    if (profile.homebase) setSelectedCity(profile.homebase);
    localStorage.setItem('tribe_user_profile', JSON.stringify(profile));
    setView(ViewState.PROFILE);
  };

  const handleInteraction = (eventId: string, type: 'like' | 'dislike') => {
    if (type === 'like') {
      setLikedEventIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(eventId)) {
          newSet.delete(eventId);
        } else {
          newSet.add(eventId);
        }
        return newSet;
      });
    } else if (type === 'dislike') {
      setHiddenEventIds(prev => new Set([...prev, eventId]));
    }
  };

  const handleToggleAttendance = (eventId: string) => {
    setAttendingEventIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleQuery = (query: string) => {
    setQueryHistory(prev => [query, ...prev.filter(q => q !== query)].slice(0, 20));
  };

  const handleNexusAsk = async (query: string) => {
    if (!query.trim()) return;
    setIsNexusThinking(true);
    setNexusInput('');
    
    // Track query
    handleQuery(query);
    
    // Simulate AI response (replace with actual Lovable AI call)
    setTimeout(() => {
      setNexusInsight(`Found ${filteredEvents.length} events matching "${query}"`);
      
      // Simple keyword-based filter
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes('party') || lowerQuery.includes('techno')) {
        setNexusFilter({ category: 'PARTY' });
      } else if (lowerQuery.includes('art') || lowerQuery.includes('culture')) {
        setNexusFilter({ category: 'ART' });
      } else if (lowerQuery.includes('sport')) {
        setNexusFilter({ category: 'SPORT' });
      }
      
      setIsNexusThinking(false);
    }, 1000);
  };

  const handleJoinCrew = (eventName: string) => {
    if (!userProfile) return;
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

  const attendingEvents = allEvents.filter(e => attendingEventIds.has(e.id));
  const likedEvents = allEvents.filter(e => likedEventIds.has(e.id));

  // Render Auth Screen only when explicitly in AUTH view
  if (view === ViewState.AUTH) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 overflow-x-hidden relative font-sans selection:bg-gold selection:text-black">
      
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/5 max-w-2xl mx-auto">
        <div className="px-6 py-4 flex justify-between items-center">
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
                  className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-white hover:text-gold transition-colors px-3 py-1.5 border border-white/20 bg-surface/50"
              >
                  {selectedCity}
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isCityMenuOpen ? 'rotate-180' : ''}`} />
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
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-20 px-0 max-w-2xl mx-auto h-screen overflow-y-auto">

        {view === ViewState.FEED && (
          <div className="animate-fadeIn pb-20">
            {/* Nexus Section */}
            <div className="px-6 pt-6 pb-4 bg-gradient-to-b from-black via-black to-transparent">
              {/* Nexus Search Bar */}
              <div className="relative group mb-3">
                <input 
                  type="text"
                  value={nexusInput}
                  onChange={(e) => setNexusInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNexusAsk(nexusInput)}
                  placeholder="Ask Nexus..."
                  className="w-full bg-black border border-white/20 focus:border-white/40 text-white text-sm placeholder-zinc-600 rounded-full py-3 px-5 outline-none transition-all"
                />
                {nexusInput.trim() && (
                  <button 
                    onClick={() => handleNexusAsk(nexusInput)}
                    className="absolute inset-y-0 right-3 flex items-center text-zinc-500 hover:text-gold transition-all"
                  >
                    <Send size={16} />
                  </button>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3">
                <button 
                  onClick={() => { setNexusInput('Vibe Check: *TRIBE BOULDERN?'); handleNexusAsk('Vibe Check: *TRIBE BOULDERN?'); }}
                  className="px-3 py-1.5 bg-black border border-white/20 text-zinc-400 text-xs whitespace-nowrap rounded-full hover:border-white/40 hover:text-white transition-all"
                >
                  Vibe Check: *TRIBE BOULDERN?
                </button>
                <button 
                  onClick={() => { setNexusInput(`Was geht heute in ${selectedCity}?`); handleNexusAsk(`Was geht heute in ${selectedCity}?`); }}
                  className="px-3 py-1.5 bg-black border border-white/20 text-zinc-400 text-xs whitespace-nowrap rounded-full hover:border-white/40 hover:text-white transition-all"
                >
                  Was geht heute in {selectedCity}?
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                      selectedCategory === cat 
                        ? 'bg-gold text-black' 
                        : 'bg-surface border border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Inline Nexus Insight */}
              {nexusInsight && (
                <div className="mt-4 bg-surface border-l-2 border-gold p-4 relative animate-fadeIn shadow-2xl rounded-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-gold" />
                      <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Nexus Insight</span>
                    </div>
                    <button onClick={() => setNexusInsight(null)} className="text-zinc-600 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-zinc-300 font-light leading-relaxed">{nexusInsight}</p>
                </div>
              )}

              {/* Active Filter Indicator */}
              {nexusFilter && (
                <div className="mt-3 flex justify-between items-center bg-gold/10 border border-gold/30 px-3 py-2 rounded-sm animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Filter size={12} className="text-gold" />
                    <span className="text-[10px] text-gold font-bold uppercase tracking-widest">Nexus Filter Active</span>
                  </div>
                  <button onClick={() => setNexusFilter(null)} className="text-[9px] text-zinc-400 hover:text-white underline">RESET</button>
                </div>
              )}
            </div>

            {/* Nexus Recommendations */}
            {spotlightEvents.length > 0 && (
              <div className="mb-12">
                  <div className="px-6 mb-4">
                      <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nexus Recommendations</h2>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-6 pb-4">
                      {spotlightEvents.map((event, i) => (
                          <div key={`spot-${i}`} className="min-w-[75vw] md:min-w-[340px] snap-center">
                              <TribeEventCard 
                                event={event} 
                                variant="hero"
                                onInteraction={handleInteraction}
                                isLiked={likedEventIds.has(event.id)}
                                isAttending={attendingEventIds.has(event.id)}
                                onToggleAttendance={handleToggleAttendance}
                              />
                          </div>
                      ))}
                  </div>
              </div>
            )}

            {/* Feed List */}
            <div className="px-6 space-y-2 pb-12">
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                    <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Your Feed</h2>
                    <button 
                      onClick={() => setIsCompactMode(!isCompactMode)}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      {isCompactMode ? <LayoutTemplate size={16} /> : <LayoutList size={16} />}
                    </button>
                </div>
                {feedEvents.length > 0 ? (
                    feedEvents.map((event, i) => (
                        <div key={i}>
                              <TribeEventCard 
                                event={event} 
                                variant={isCompactMode ? 'compact' : 'standard'}
                                onJoinCrew={handleJoinCrew}
                                onInteraction={handleInteraction}
                                isLiked={likedEventIds.has(event.id)}
                                isAttending={attendingEventIds.has(event.id)}
                                onToggleAttendance={handleToggleAttendance}
                              />
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

        {view === ViewState.TRIBE_AI && (
          <TribeAIChat 
            onClose={() => setView(ViewState.FEED)} 
            events={filteredEvents}
            onQuery={handleQuery}
          />
        )}
        {view === ViewState.COMMUNITY && <TribeCommunityBoard selectedCity={selectedCity} userProfile={userProfile} />}
        {view === ViewState.MAP && (
            <div className="absolute inset-0 pt-16 h-[calc(100vh-80px)]">
                 <TribeMapView events={filteredEvents} posts={posts} selectedCity={selectedCity} />
            </div>
        )}
        {view === ViewState.PROFILE && (
          <ProfileView 
            userProfile={userProfile}
            attendingEvents={attendingEvents}
            likedEvents={likedEvents}
            onToggleAttendance={(event) => handleToggleAttendance(event.id)}
            attendingEventIds={attendingEventIds}
            likedEventIds={likedEventIds}
          />
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

          <button
            onClick={() => setView(userProfile ? ViewState.PROFILE : ViewState.AUTH)}
            className={`flex flex-col items-center gap-1 p-2 ${view === ViewState.PROFILE ? 'text-white' : 'text-zinc-600'}`}
          >
              <User size={20} strokeWidth={1.5} />
              <span className="text-[9px] font-medium uppercase tracking-wider">Profile</span>
          </button>
      </nav>

    </div>
  );
};