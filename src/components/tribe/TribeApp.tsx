import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ViewState, TribeEvent, Post, UserProfile, NexusFilter } from '@/types/tribe';
import { convertToTribeEvent } from '@/utils/tribe/eventHelpers';
import { TribeEventCard } from './TribeEventCard';
import { TribeAIChat } from './TribeAIChat';
import { TribeCommunityBoard } from './TribeCommunityBoard';
import { TribeMapView } from './TribeMapView';
import { TribeBottomNav } from './TribeBottomNav';
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
const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

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
  
  // New message notification state
  const [hasNewCommunityMessages, setHasNewCommunityMessages] = useState(false);

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

  // Check for new community messages on app start
  useEffect(() => {
    checkForNewMessages();
  }, []);

  useEffect(() => {
    fetchEvents();
    if (userProfile) {
      loadPosts();
    }
  }, [selectedCity, userProfile]);

  const checkForNewMessages = async () => {
    try {
      const lastSeenTimestamp = localStorage.getItem('tribe_last_seen_community');
      
      // Fetch latest community message
      const { data, error } = await supabase
        .from('chat_messages')
        .select('created_at')
        .eq('group_id', 'tribe_community_board')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return;

      if (!lastSeenTimestamp) {
        // New user - show notification
        setHasNewCommunityMessages(true);
      } else {
        // Check if there are newer messages
        const lastSeen = new Date(lastSeenTimestamp);
        const latestMessage = new Date(data.created_at);
        if (latestMessage > lastSeen) {
          setHasNewCommunityMessages(true);
        }
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  };

  const markCommunityAsSeen = () => {
    localStorage.setItem('tribe_last_seen_community', new Date().toISOString());
    setHasNewCommunityMessages(false);
  };

  const handleViewChange = (newView: ViewState) => {
    setView(newView);
    if (newView === ViewState.COMMUNITY) {
      markCommunityAsSeen();
    }
  };

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
      setNexusInsight(`MIA found ${filteredEvents.length} events matching "${query}"`);
      
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

  const handleJoinTribe = (eventName: string) => {
    if (!userProfile) return;
    const newPost: Post = {
        id: Date.now().toString(),
        user: userProfile.username,
        text: `Who is going to "${eventName}"? Looking for tribe members!`,
        city: selectedCity,
        likes: 0,
        time: 'Just now',
        tags: ['TribeCall'],
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

          {/* CITY SELECTOR & USER AVATAR */}
          <div className="flex items-center gap-3">
              <div className="relative">
                  <button 
                      onClick={() => setIsCityMenuOpen(!isCityMenuOpen)} 
                      className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-gold hover:text-white transition-colors px-3 py-1.5 border border-white/20 bg-black/50"
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

              {/* USER AVATAR */}
              <button
                onClick={() => setView(userProfile ? ViewState.PROFILE : ViewState.AUTH)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 hover:border-gold transition-colors"
              >
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <User size={20} className="text-zinc-600" />
                  </div>
                )}
              </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-20 px-0 max-w-2xl mx-auto h-screen overflow-y-auto">

        {view === ViewState.FEED && (
          <div className="animate-fadeIn pb-20">
            {/* MIA Section */}
            <div className="px-6 pt-2 pb-6 bg-gradient-to-b from-black via-black to-transparent">
              {/* MIA Search Bar */}
              <div className="relative group mb-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
                  <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
                </div>
                <input 
                  type="text"
                  value={nexusInput}
                  onChange={(e) => setNexusInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNexusAsk(nexusInput)}
                  placeholder="Ask MIA..."
                  className="flex-1 bg-black border border-white/[0.08] focus:border-white/20 text-white text-sm placeholder-zinc-700 rounded-full py-2.5 px-4 outline-none transition-all"
                />
                {nexusInput.trim() && (
                  <button 
                    onClick={() => handleNexusAsk(nexusInput)}
                    className="absolute inset-y-0 right-3 flex items-center text-zinc-600 hover:text-gold transition-all"
                  >
                    <Send size={14} />
                  </button>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
                <button 
                  onClick={() => { setNexusInput('Vibe Check: *TRIBE BOULDERN?'); handleNexusAsk('Vibe Check: *TRIBE BOULDERN?'); }}
                  className="px-4 py-2 bg-zinc-900/50 border border-white/10 text-zinc-400 text-xs whitespace-nowrap rounded-full hover:border-white/30 hover:text-white transition-all"
                >
                  Vibe Check: *TRIBE BOULDERN?
                </button>
                <button 
                  onClick={() => { setNexusInput(`Was geht heute in ${selectedCity}?`); handleNexusAsk(`Was geht heute in ${selectedCity}?`); }}
                  className="px-4 py-2 bg-zinc-900/50 border border-white/10 text-zinc-400 text-xs whitespace-nowrap rounded-full hover:border-white/30 hover:text-white transition-all"
                >
                  Was geht heute in {selectedCity}?
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-3">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${
                      selectedCategory === cat 
                        ? 'text-gold' 
                        : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Inline MIA Insight */}
              {nexusInsight && (
                <div className="mt-4 bg-surface border-l-2 border-gold p-4 relative animate-fadeIn shadow-2xl rounded-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full overflow-hidden">
                        <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
                      </div>
                      <span className="text-[10px] font-bold text-gold uppercase tracking-widest">MIA Insight</span>
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
                    <span className="text-[10px] text-gold font-bold uppercase tracking-widest">MIA Filter Active</span>
                  </div>
                  <button onClick={() => setNexusFilter(null)} className="text-[9px] text-zinc-400 hover:text-white underline">RESET</button>
                </div>
              )}
            </div>

            {/* MIA Recommendations */}
            {spotlightEvents.length > 0 && (
              <div className="mb-12">
                  <div className="px-6 mb-5">
                      <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full overflow-hidden">
                          <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
                        </div>
                        MIA Recommendations
                      </h2>
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
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                    <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Your Feed</h2>
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
                                onJoinTribe={handleJoinTribe}
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
      <TribeBottomNav 
        currentView={view} 
        onViewChange={handleViewChange}
        hasNewCommunityMessages={hasNewCommunityMessages}
      />

    </div>
  );
};