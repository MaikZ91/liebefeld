import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ViewState, TribeEvent, Post, UserProfile, NexusFilter } from '@/types/tribe';
import { UserProfile as ChatUserProfile } from '@/types/chatTypes';
import { convertToTribeEvent } from '@/utils/tribe/eventHelpers';
import { TribeEventCard } from './TribeEventCard';
import { TribeAIChat } from './TribeAIChat';
import { TribeCommunityBoard } from './TribeCommunityBoard';
import { TribeMapView } from './TribeMapView';
import { TribeBottomNav } from './TribeBottomNav';
import { AuthScreen } from './AuthScreen';
import { ProfileView } from './ProfileView';
import { TribeLiveTicker } from '@/components/TribeLiveTicker';
import { LocationBlockDialog } from './LocationBlockDialog';
import { AppDownloadPrompt } from './AppDownloadPrompt';
import { TribeUserMatcher } from './TribeUserMatcher';
import UserProfileDialog from '@/components/users/UserProfileDialog';

import { dislikeService } from '@/services/dislikeService';
import { personalizationService } from '@/services/personalizationService';
import { useToast } from '@/hooks/use-toast';
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
  LayoutTemplate,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

const CITIES = ['Bielefeld', 'Berlin', 'Hamburg', 'Köln', 'München'];
const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

const CATEGORIES = ['ALL', 'PARTY', 'ART', 'CONCERT', 'SPORT'];

export const TribeApp: React.FC = () => {
  const [view, setView] = useState<ViewState>(ViewState.COMMUNITY);
  const [selectedCity, setSelectedCity] = useState<string>('Bielefeld');
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const saved = localStorage.getItem('tribe_selected_category');
    return saved || 'ALL';
  });
  const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(() => {
    const saved = localStorage.getItem('tribe_view_mode');
    return saved === 'compact';
  });
  
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [loadedDateRange, setLoadedDateRange] = useState<{ start: string; end: string } | null>(null);
  
  // Event tracking state
  const [hiddenEventIds, setHiddenEventIds] = useState<Set<string>>(new Set());
  const [likedEventIds, setLikedEventIds] = useState<Set<string>>(new Set());
  const [attendingEventIds, setAttendingEventIds] = useState<Set<string>>(new Set());
  const [eventMatchScores, setEventMatchScores] = useState<Map<string, number>>(new Map());
  
  // Collapsed day sections state (for compact mode after first like)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [hasLikedFirstEvent, setHasLikedFirstEvent] = useState<boolean>(() => {
    return localStorage.getItem('tribe_has_first_like') === 'true';
  });
  const [showLikeTutorial, setShowLikeTutorial] = useState<boolean>(() => {
    return localStorage.getItem('tribe_seen_like_tutorial') !== 'true';
  });
  const { toast } = useToast();
  const [locationBlockDialog, setLocationBlockDialog] = useState<{ open: boolean; location: string | null }>({ 
    open: false, 
    location: null 
  });
  const [profileDialog, setProfileDialog] = useState<{ open: boolean; profile: ChatUserProfile | null; loading: boolean }>({
    open: false,
    profile: null,
    loading: false
  });
  
  
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
  const [requiresAuth, setRequiresAuth] = useState<boolean>(false);
  const [showProfileHint, setShowProfileHint] = useState<boolean>(false);

  // Initialize auth and preferences
  useEffect(() => {
    const savedProfile = localStorage.getItem('tribe_user_profile');
    const hasSeenProfileHint = localStorage.getItem('tribe_seen_profile_hint');
    
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setUserProfile(parsedProfile);
      if (parsedProfile.homebase) setSelectedCity(parsedProfile.homebase);
      setRequiresAuth(false);
      
      // Show profile hint for guest users who haven't dismissed it yet
      if (parsedProfile.username?.startsWith('Guest_') && !hasSeenProfileHint) {
        setShowProfileHint(true);
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          setShowProfileHint(false);
          localStorage.setItem('tribe_seen_profile_hint', 'true');
        }, 10000);
      }
    } else {
      // First time user - create a guest profile automatically
      const guestNum = Math.floor(Math.random() * 9999);
      const guestProfile: UserProfile = {
        username: `Guest_${guestNum}`,
        bio: '',
        avatarUrl: '/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png',
        homebase: 'Bielefeld',
        interests: [],
        favorite_locations: []
      };
      localStorage.setItem('tribe_user_profile', JSON.stringify(guestProfile));
      localStorage.setItem('chat_username', guestProfile.username);
      localStorage.setItem('chat_avatar', guestProfile.avatarUrl);
      setUserProfile(guestProfile);
      setRequiresAuth(false);
      
      // Show profile hint for first-time users
      setShowProfileHint(true);
      setTimeout(() => {
        setShowProfileHint(false);
        localStorage.setItem('tribe_seen_profile_hint', 'true');
      }, 10000);
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
    localStorage.setItem('tribe_selected_category', selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem('tribe_view_mode', isCompactMode ? 'compact' : 'normal');
  }, [isCompactMode]);

  // Check for new community messages on app start
  useEffect(() => {
    checkForNewMessages();
  }, []);

  useEffect(() => {
    // Initial load: first 50 events
    setAllEvents([]);
    setLoadedDateRange(null);
    setHasMoreEvents(true);
    fetchEvents(true);
    if (userProfile) {
      loadPosts();
    }
  }, [selectedCity, userProfile]);
  
  // Calculate match scores when events load
  useEffect(() => {
    recalculateMatchScores();
  }, [allEvents]);

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

  const fetchEvents = async (isInitial = false, specificDate?: Date) => {
    try {
      if (isLoadingMore && !isInitial) return;
      setIsLoadingMore(true);

      const pageSize = 50;
      let startDate: string;
      let endDate: string;

      if (specificDate) {
        // Load events for the selected month
        const monthStart = new Date(specificDate.getFullYear(), specificDate.getMonth(), 1);
        const monthEnd = new Date(specificDate.getFullYear(), specificDate.getMonth() + 1, 0);
        startDate = monthStart.toISOString().split('T')[0];
        endDate = monthEnd.toISOString().split('T')[0];
        
        console.log('🔄 [TribeApp fetchEvents] Loading events for month:', startDate, 'to', endDate);
      } else if (isInitial) {
        // Initial load: today + 50 events
        startDate = new Date().toISOString().split('T')[0];
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 365);
        endDate = futureDate.toISOString().split('T')[0];
        
        console.log('🔄 [TribeApp fetchEvents] Initial load from:', startDate);
      } else {
        // Load more: continue from last loaded date
        if (!loadedDateRange) {
          setIsLoadingMore(false);
          return;
        }
        startDate = loadedDateRange.end;
        const futureDate = new Date(startDate);
        futureDate.setDate(futureDate.getDate() + 365);
        endDate = futureDate.toISOString().split('T')[0];
        
        console.log('🔄 [TribeApp fetchEvents] Loading more from:', startDate);
      }

      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .eq('city', selectedCity)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .limit(pageSize);

      if (error) throw error;
      
      console.log('🔄 [TribeApp fetchEvents] Received:', data?.length, 'events');
      
      const tribeEvents = (data || []).map(convertToTribeEvent);
      
      if (specificDate) {
        // Merge with existing events
        setAllEvents(prev => {
          const merged = [...prev, ...tribeEvents];
          const unique = Array.from(new Map(merged.map(e => [e.id, e])).values());
          return unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
      } else if (isInitial) {
        setAllEvents(tribeEvents);
        if (tribeEvents.length > 0) {
          const lastDate = tribeEvents[tribeEvents.length - 1].date;
          setLoadedDateRange({ start: startDate, end: lastDate });
        }
      } else {
        // Append for infinite scroll - deduplicate by ID
        setAllEvents(prev => {
          const merged = [...prev, ...tribeEvents];
          const unique = Array.from(new Map(merged.map(e => [e.id, e])).values());
          return unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        if (tribeEvents.length > 0) {
          const lastDate = tribeEvents[tribeEvents.length - 1].date;
          setLoadedDateRange(prev => prev ? { ...prev, end: lastDate } : { start: startDate, end: lastDate });
        }
      }
      
      setHasMoreEvents(tribeEvents.length === pageSize);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadMoreEvents = () => {
    if (!isLoadingMore && hasMoreEvents) {
      fetchEvents(false);
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
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
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
    
    // Remove blocked locations
    result = result.filter(e => !e.location || !dislikeService.isLocationBlocked(e.location));
    
    // Filter by selected date from calendar picker
    if (selectedDate) {
      const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('🔄 [TribeApp filteredEvents] Filtering by date:', selectedDateStr);
      console.log('🔄 [TribeApp filteredEvents] Before date filter:', result.length);
      result = result.filter(e => {
        const matches = e.date === selectedDateStr;
        if (!matches) {
          console.log('🔄 Date mismatch:', e.date, 'vs', selectedDateStr, 'for event:', e.title);
        }
        return matches;
      });
      console.log('🔄 [TribeApp filteredEvents] After date filter:', result.length);
    }
    
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
    
    // Helper function to detect "Ausgehen" events by keywords
    const isAusgehenEvent = (event: TribeEvent): boolean => {
      const category = (event.category || '').toLowerCase();
      const title = (event.title || '').toLowerCase();
      const location = (event.location || '').toLowerCase();
      
      // Check category first - including "Sonstiges"
      if (['ausgehen', 'party', 'konzert', 'concert', 'sonstiges', 'other'].includes(category)) {
        return true;
      }
      
      // Check for ausgehen keywords in title or location
      const ausgehenKeywords = [
        'party', 'club', 'konzert', 'concert', 'bar', 'kneipe', 'disco',
        'festival', 'live', 'dj', 'techno', 'house', 'punk', 'rock',
        'jazz', 'blues', 'open air', 'club', 'tanzveranstaltung', 'tanzen',
        'kulturzentrum', 'forum', 'ringlokschuppen', 'bunker', 'nachtleben'
      ];
      
      return ausgehenKeywords.some(keyword => 
        title.includes(keyword) || location.includes(keyword)
      );
    };
    
    // Sort with priority based on match scores
    result.sort((a, b) => {
      // Priority 0: Match score first (higher score = better match)
      const scoreA = eventMatchScores.get(a.id) || 50;
      const scoreB = eventMatchScores.get(b.id) || 50;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      
      const isLikedA = likedEventIds.has(a.id);
      const isLikedB = likedEventIds.has(b.id);
      
      // Priority 1: Liked events come next
      if (isLikedA && !isLikedB) return -1;
      if (!isLikedA && isLikedB) return 1;
      
      // Check if events have images
      const hasImageA = !!a.image_url;
      const hasImageB = !!b.image_url;
      
      // Priority 2: ALL events with images come before events without images
      if (hasImageA && !hasImageB) return -1;
      if (!hasImageA && hasImageB) return 1;
      
      // Priority 3: Among events with images, sort by category priority
      const isAusgehenA = isAusgehenEvent(a);
      const isAusgehenB = isAusgehenEvent(b);
      
      // Ausgehen events (by category or keywords) come first
      if (isAusgehenA && !isAusgehenB) return -1;
      if (!isAusgehenA && isAusgehenB) return 1;
      
      // Then normal category priority
      const categoryOrder: Record<string, number> = {
        'kreativität': 2,
        'art': 2,
        'sport': 3,
      };
      
      const categoryA = categoryOrder[a.category?.toLowerCase() || ''] || 4; // Other categories with images get priority 4
      const categoryB = categoryOrder[b.category?.toLowerCase() || ''] || 4;
      
      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }
      
      // Priority 4: Within same category, sort by date and time
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      
      // If same date, sort by time
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
    
    return result;
  }, [allEvents, selectedCity, selectedCategory, hiddenEventIds, likedEventIds, nexusFilter, selectedDate]);

  const spotlightEvents = filteredEvents.slice(0, 5);
  const feedEvents = filteredEvents; // Show all events in feed, including spotlight events (sorted by match score)

  const handleLogin = async (profile: UserProfile) => {
    try {
      // Call Edge Function to create user profile in DB
      const { data, error } = await supabase.functions.invoke('manage_user_profile', {
        body: {
          action: 'createOrUpdateProfile',
          profile: {
            username: profile.username,
            avatar: profile.avatarUrl,
            interests: [],
            favorite_locations: profile.homebase ? [profile.homebase] : [],
            hobbies: []
          }
        }
      });

      if (error) {
        console.error('Error creating user profile:', error);
        toast({
          title: "Fehler",
          description: "Profil konnte nicht erstellt werden",
          variant: "destructive"
        });
        return;
      }

      console.log('User profile created:', data);

      // Welcome message removed from chat - shown in NewMembersWidget instead
      // Firebase push notification still sent via trigger on user_profiles insert

      // Save profile locally and update state
      setUserProfile(profile);
      if (profile.homebase) setSelectedCity(profile.homebase);
      localStorage.setItem('tribe_user_profile', JSON.stringify(profile));
      setRequiresAuth(false);

      toast({
        title: "Willkommen!",
        description: "Dein Profil wurde erfolgreich erstellt"
      });
    } catch (error) {
      console.error('Unexpected error during login:', error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive"
      });
    }
  };

  const recalculateMatchScores = () => {
    const scores = new Map<string, number>();
    allEvents.forEach(event => {
      const score = personalizationService.calculateMatchScore(event);
      scores.set(event.id, score);
    });
    setEventMatchScores(scores);
  };

  const handleInteraction = async (eventId: string, type: 'like' | 'dislike') => {
    const event = allEvents.find(e => e.id === eventId);
    
    if (type === 'dislike') {
      setHiddenEventIds(prev => new Set([...prev, eventId]));
      
      // Track dislike for personalization
      if (event) {
        personalizationService.trackDislike(event);
      }
      
      const { shouldAskBlock, location } = await dislikeService.dislikeEvent(
        eventId,
        event?.location || undefined
      );
      
      if (shouldAskBlock && location) {
        setLocationBlockDialog({ open: true, location });
      }
      
      // Recalculate match scores after dislike
      recalculateMatchScores();
    } else if (type === 'like') {
      const isFirstLike = !hasLikedFirstEvent && likedEventIds.size === 0;
      
      setLikedEventIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(eventId)) {
          newSet.delete(eventId);
        } else {
          newSet.add(eventId);
          
          // First like ever - collapse the feed and notify user
          if (isFirstLike) {
            setHasLikedFirstEvent(true);
            localStorage.setItem('tribe_has_first_like', 'true');
            toast({
              title: "Feed optimiert! ✨",
              description: "Deine Favoriten stehen jetzt oben. Tippe 'Mehr anzeigen' um alle Events zu sehen."
            });
          }
        }
        return newSet;
      });
      
      // Track like for personalization
      if (event) {
        personalizationService.trackLike(event);
      }
      
      // Recalculate match scores after like
      recalculateMatchScores();
    }
  };
  
  const handleBlockLocation = () => {
    if (locationBlockDialog.location) {
      dislikeService.blockLocation(locationBlockDialog.location);
      toast({
        title: "Location blockiert",
        description: `Events von "${locationBlockDialog.location}" werden nicht mehr angezeigt.`
      });
      setLocationBlockDialog({ open: false, location: null });
    }
  };
  
  const handleCancelBlock = () => {
    setLocationBlockDialog({ open: false, location: null });
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

  const handleTickerEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
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
        timestamp: new Date().toISOString(),
        tags: ['TribeCall'],
        userAvatar: userProfile.avatarUrl
    };
    setPosts([newPost, ...posts]);
    setView(ViewState.COMMUNITY);
  };

  const attendingEvents = allEvents.filter(e => attendingEventIds.has(e.id));
  const likedEvents = allEvents.filter(e => likedEventIds.has(e.id));

  // Render Auth Screen when explicitly in AUTH view OR for first time users
  if (view === ViewState.AUTH || requiresAuth) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Render User Matcher
  if (view === ViewState.MATCHER) {
    return (
      <TribeUserMatcher 
        currentUserProfile={userProfile}
        onBack={() => setView(ViewState.PROFILE)}
      />
    );
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
                      className="text-[10px] font-extrabold uppercase tracking-[0.25em] flex items-center gap-1.5 text-white hover:text-gold transition-colors px-2 py-1 border border-white/10 bg-black/30"
                  >
                      {selectedCity}
                      <ChevronDown size={12} className={`transition-transform duration-300 ${isCityMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isCityMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 bg-black border border-white/10 min-w-[140px] z-50 shadow-2xl animate-fadeIn">
                          {CITIES.map(city => (
                              <button 
                                  key={city} 
                                  onClick={() => { setSelectedCity(city); setIsCityMenuOpen(false); }} 
                                  className="block w-full text-right px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                              >
                                  {city}
                              </button>
                          ))}
                      </div>
                  )}
              </div>

              {/* USER AVATAR with Profile Hint */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileHint(false);
                    localStorage.setItem('tribe_seen_profile_hint', 'true');
                    setView(userProfile ? ViewState.PROFILE : ViewState.AUTH);
                  }}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-colors ${
                    showProfileHint 
                      ? 'border-gold animate-pulse' 
                      : 'border-white/20 hover:border-gold'
                  }`}
                >
                  {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <User size={20} className="text-zinc-600" />
                    </div>
                  )}
                </button>
                
                {/* Profile creation hint tooltip */}
                {showProfileHint && (
                  <div className="absolute top-full right-0 mt-2 whitespace-nowrap animate-fadeIn">
                    <div className="bg-zinc-900 border border-gold/30 px-3 py-1.5 rounded shadow-lg">
                      <span className="text-[10px] text-gold font-medium">Profil erstellen</span>
                    </div>
                    {/* Arrow pointing up */}
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-zinc-900 border-l border-t border-gold/30 transform rotate-45" />
                  </div>
                )}
              </div>
          </div>
        </div>
      </header>

      {/* --- LIVE TICKER --- */}
      {view === ViewState.FEED && (
        <div className="fixed top-[73px] left-0 right-0 z-40 max-w-2xl mx-auto">
          <TribeLiveTicker
            events={allEvents.map(e => ({
              id: e.id,
              date: e.date,
              title: e.title,
              location: e.location,
              likes: likedEventIds.has(e.id) ? (e.likes || 0) + 1 : e.likes || 0,
            }))}
            selectedCity={selectedCity}
            onEventClick={handleTickerEventClick}
          />
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className={`${view === ViewState.COMMUNITY ? 'pt-16' : 'pt-[110px]'} px-0 max-w-2xl mx-auto h-screen overflow-y-auto`}>

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
                      <h2 className="text-xs font-extrabold text-white uppercase tracking-[0.25em] flex items-center gap-2">
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
                          matchScore={eventMatchScores.get(event.id)}
                        />
                          </div>
                      ))}
                  </div>
              </div>
            )}

            {/* Feed List */}
            <div className="px-6 space-y-2 pb-12">
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                    <h2 className="text-xs font-extrabold text-white uppercase tracking-[0.25em]">Your Feed</h2>
                    <div className="flex items-center gap-3">
                      {/* Vibe Filter */}
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-black text-zinc-400 text-[10px] uppercase tracking-wider border border-white/10 px-2 py-1 rounded-sm focus:border-gold focus:text-gold outline-none"
                      >
                        <option value="ALL">All Vibes</option>
                        <option value="PARTY">Party</option>
                        <option value="ART">Art</option>
                        <option value="CONCERT">Concert</option>
                        <option value="SPORT">Sport</option>
                      </select>
                      
                      {/* Calendar Picker */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-zinc-500 hover:text-white transition-colors">
                            <CalendarIcon size={16} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="end">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              if (date) {
                                // Check if we need to load events for this month
                                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
                                
                                // Check if we have events for this date range
                                const hasEventsInRange = allEvents.some(e => e.date >= monthStart && e.date <= monthEnd);
                                
                                if (!hasEventsInRange) {
                                  console.log('🔄 [TribeApp] Loading events for selected month');
                                  fetchEvents(false, date);
                                }
                              }
                            }}
                            className="pointer-events-auto"
                          />
                          {selectedDate && (
                            <div className="p-3 border-t border-white/10">
                              <button
                                onClick={() => setSelectedDate(undefined)}
                                className="w-full text-xs text-zinc-400 hover:text-white transition-colors"
                              >
                                Filter zurücksetzen
                              </button>
                            </div>
                          )}
                        </PopoverContent>
                      </Popover>
                      
                      <button 
                        onClick={() => setIsCompactMode(!isCompactMode)}
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        {isCompactMode ? <LayoutTemplate size={16} /> : <LayoutList size={16} />}
                      </button>
                    </div>
                </div>
                {/* Like Tutorial for first-time Feed visitors */}
                {showLikeTutorial && view === ViewState.FEED && (
                  <div className="mb-6 bg-zinc-900/80 border border-gold/30 rounded-lg p-4 animate-fadeIn">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-gold uppercase tracking-widest">💡 Tipp</span>
                      <button 
                        onClick={() => {
                          setShowLikeTutorial(false);
                          localStorage.setItem('tribe_seen_like_tutorial', 'true');
                        }}
                        className="text-zinc-500 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <strong className="text-white">Like Events</strong> die dich interessieren! Je mehr du likest, desto besser lernt MIA deinen Geschmack kennen und zeigt dir passende Events zuerst. 
                      Nach deinem ersten Like wird der Feed automatisch auf deine Top-Picks reduziert.
                    </p>
                  </div>
                )}
                
                {feedEvents.length > 0 ? (
                    (() => {
                      // Group events by date in compact mode
                      if (isCompactMode) {
                        const grouped: Record<string, TribeEvent[]> = {};
                        feedEvents.forEach(event => {
                          if (!grouped[event.date]) grouped[event.date] = [];
                          grouped[event.date].push(event);
                        });
                        
                        const sortedDates = Object.keys(grouped).sort();
                        const MAX_COLLAPSED_EVENTS = 5;
                        
                        return sortedDates.map(date => {
                          const dateObj = new Date(date);
                          const weekday = dateObj.toLocaleDateString('de-DE', { weekday: 'long' });
                          const day = dateObj.getDate();
                          const month = dateObj.toLocaleDateString('de-DE', { month: 'long' });
                          
                          const allEventsForDate = grouped[date];
                          const isExpanded = expandedDates.has(date);
                          const shouldCollapse = hasLikedFirstEvent && allEventsForDate.length > MAX_COLLAPSED_EVENTS;
                          const displayedEvents = shouldCollapse && !isExpanded 
                            ? allEventsForDate.slice(0, MAX_COLLAPSED_EVENTS) 
                            : allEventsForDate;
                          const hiddenCount = allEventsForDate.length - MAX_COLLAPSED_EVENTS;
                          
                          return (
                            <div key={date} className="mb-6">
                              <h3 className="text-sm font-serif text-white/90 mb-2 capitalize">
                                {weekday}, {day}. {month}
                              </h3>
                              <div className="space-y-0">
                                {displayedEvents.map((event) => (
                                  <div 
                                    key={event.id}
                                    className="animate-fade-in transition-all duration-300 ease-out"
                                  >
                                    <TribeEventCard 
                                      event={event} 
                                      variant="compact"
                                      onJoinTribe={handleJoinTribe}
                                      onInteraction={handleInteraction}
                                      isLiked={likedEventIds.has(event.id)}
                                      isAttending={attendingEventIds.has(event.id)}
                                      onToggleAttendance={handleToggleAttendance}
                                      matchScore={eventMatchScores.get(event.id)}
                                    />
                                  </div>
                                ))}
                              </div>
                              
                              {/* Expand button for collapsed dates */}
                              {shouldCollapse && !isExpanded && hiddenCount > 0 && (
                                <button
                                  onClick={() => setExpandedDates(prev => new Set([...prev, date]))}
                                  className="w-full mt-2 py-2 text-[10px] text-zinc-500 hover:text-gold uppercase tracking-widest border border-dashed border-white/10 hover:border-gold/30 transition-colors flex items-center justify-center gap-2"
                                >
                                  <ChevronDown size={12} />
                                  +{hiddenCount} weitere Events anzeigen
                                </button>
                              )}
                              
                              {/* Collapse button when expanded */}
                              {shouldCollapse && isExpanded && (
                                <button
                                  onClick={() => setExpandedDates(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(date);
                                    return newSet;
                                  })}
                                  className="w-full mt-2 py-2 text-[10px] text-zinc-500 hover:text-gold uppercase tracking-widest border border-dashed border-white/10 hover:border-gold/30 transition-colors flex items-center justify-center gap-2"
                                >
                                  <ChevronDown size={12} className="rotate-180" />
                                  Weniger anzeigen
                                </button>
                              )}
                            </div>
                          );
                        });
                      }
                      
                      // Standard mode - no grouping
                      return feedEvents.map((event) => (
                        <div 
                          key={event.id}
                          className="animate-fade-in transition-all duration-300 ease-out"
                        >
                          <TribeEventCard 
                            event={event} 
                            variant="standard"
                            onJoinTribe={handleJoinTribe}
                            onInteraction={handleInteraction}
                            isLiked={likedEventIds.has(event.id)}
                            isAttending={attendingEventIds.has(event.id)}
                            onToggleAttendance={handleToggleAttendance}
                            matchScore={eventMatchScores.get(event.id)}
                          />
                        </div>
                      ));
                    })()
                ) : (
                    <div className="py-10 text-center text-zinc-600 font-light text-sm">
                        No events in this sector.
                    </div>
                )}
                
                {/* Infinite Scroll Trigger */}
                {!selectedDate && hasMoreEvents && feedEvents.length > 0 && (
                  <div 
                    ref={(el) => {
                      if (!el) return;
                      const observer = new IntersectionObserver(
                        (entries) => {
                          if (entries[0].isIntersecting && !isLoadingMore) {
                            console.log('🔄 [TribeApp] Infinite scroll triggered');
                            loadMoreEvents();
                          }
                        },
                        { threshold: 0.1 }
                      );
                      observer.observe(el);
                      return () => observer.disconnect();
                    }}
                    className="h-20 flex items-center justify-center"
                  >
                    {isLoadingMore && (
                      <div className="text-zinc-600 text-xs">Lädt weitere Events...</div>
                    )}
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
        {view === ViewState.COMMUNITY && (
          <TribeCommunityBoard 
            selectedCity={selectedCity} 
            userProfile={userProfile}
            onProfileClick={async (username) => {
              setProfileDialog({ open: true, profile: null, loading: true });
              try {
                const { data, error } = await supabase
                  .from('user_profiles')
                  .select('*')
                  .eq('username', username)
                  .maybeSingle();
                if (error) throw error;
                setProfileDialog({ open: true, profile: data, loading: false });
              } catch (err) {
                console.error('Error fetching profile:', err);
                setProfileDialog({ open: false, profile: null, loading: false });
              }
            }}
          />
        )}
        
        {/* User Profile Dialog */}
        <UserProfileDialog
          open={profileDialog.open}
          onOpenChange={(open) => setProfileDialog(prev => ({ ...prev, open }))}
          userProfile={profileDialog.profile}
          loading={profileDialog.loading}
        />
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
            onOpenMatcher={() => setView(ViewState.MATCHER)}
            onProfileUpdate={(updatedProfile) => {
              setUserProfile(updatedProfile);
            }}
          />
        )}


      </main>

      {/* --- BOTTOM NAVIGATION --- */}
      <TribeBottomNav 
        currentView={view} 
        onViewChange={handleViewChange}
        hasNewCommunityMessages={hasNewCommunityMessages}
      />

      {/* --- EVENT DETAIL DIALOG --- */}
      {selectedEventId && (() => {
        const selectedEvent = allEvents.find(e => e.id === selectedEventId);
        if (!selectedEvent) return null;
        
        return (
          <div 
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedEventId(null)}
          >
            <div 
              className="bg-zinc-900 border border-white/10 max-w-lg w-full max-h-[80vh] overflow-y-auto animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <TribeEventCard
                event={selectedEvent}
                variant="standard"
                isLiked={likedEventIds.has(selectedEvent.id)}
                isAttending={attendingEventIds.has(selectedEvent.id)}
                onInteraction={(eventId, type) => handleInteraction(eventId, type)}
                onToggleAttendance={handleToggleAttendance}
              />
              <button
                onClick={() => setSelectedEventId(null)}
                className="w-full py-3 text-center text-zinc-500 hover:text-white transition-colors border-t border-white/10 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        );
      })()}

      {/* --- LOCATION BLOCK DIALOG --- */}
      <LocationBlockDialog 
        open={locationBlockDialog.open}
        location={locationBlockDialog.location || ''}
        onBlock={handleBlockLocation}
        onCancel={handleCancelBlock}
      />

      {/* --- APP DOWNLOAD PROMPT --- */}
      <AppDownloadPrompt />

    </div>
  );
};