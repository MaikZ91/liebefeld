import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ViewState, TribeEvent, Post, UserProfile, NexusFilter } from "@/types/tribe";
import { UserProfile as ChatUserProfile } from "@/types/chatTypes";
import { convertToTribeEvent } from "@/utils/tribe/eventHelpers";
import { groupSimilarEvents, GroupedEvent } from "@/utils/tribe/eventGrouping";
import { getCategoryGroup } from "@/utils/eventCategoryGroups";
import { TribeEventCard } from "./TribeEventCard";
import { TribeCommunityBoard } from "./TribeCommunityBoard";
import { TribeMapView } from "./TribeMapView";
import hochschulsportImg from "@/assets/groups/hochschulsport.jpg";
import sportImg from "@/assets/groups/sport.jpg";
import vhsImg from "@/assets/groups/vhs.jpg";
import kinoImg from "@/assets/groups/kino.jpg";
import { TribeBottomNav } from "./TribeBottomNav";
import { ProfileView } from "./ProfileView";
import { TribeLiveTicker } from "@/components/TribeLiveTicker";
import { LocationBlockDialog } from "./LocationBlockDialog";
import { AppDownloadPrompt } from "./AppDownloadPrompt";
import PeopleList from "./PeopleList";
import { InterestsDialog } from "./InterestsDialog";
import { MiaInlineChat } from "./MiaInlineChat";
import { MiaNotificationHub } from "./MiaNotificationHub";
import { LiveMapWidget } from "./LiveMapWidget";
import { ExploreSectionCompact } from "./ExploreSectionCompact";
import UserProfileDialog from "@/components/users/UserProfileDialog";
import { useOnboardingFlow } from "@/hooks/useOnboardingFlow";
import { OnboardingWorkflow } from "./onboarding/OnboardingWorkflow";
import { WelcomePage } from "./onboarding/WelcomePage";


import { dislikeService } from "@/services/dislikeService";
import { personalizationService } from "@/services/personalizationService";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  User,
  X,
  Filter,
  Calendar as CalendarIcon,
  Map as MapIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

const CITIES = [
  "Deutschland",
  "Bielefeld",
  "Berlin",
  "Hamburg",
  "Köln",
  "München",
  "Leipzig",
  "Münster",
  "Essen",
  "Dortmund",
  "Düsseldorf",
  "Stuttgart",
  "Dresden",
  "Frankfurt",
  "Bremen",
];
const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

const CATEGORIES = ["ALL", "FÜR MICH", "PARTY", "ART", "CONCERT", "SPORT"];

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150&h=150"
];

// Create guest profile instantly (no database query for speed)
const createGuestProfileSync = (): UserProfile => {
  const guestNumber = Date.now().toString().slice(-6);
  const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
  
  const guestProfile: UserProfile = {
    username: `Guest_${guestNumber}`,
    avatarUrl: randomAvatar,
    bio: 'Guest',
    homebase: 'Bielefeld'
  };
  
  // Save to database in background (fire-and-forget)
  supabase
    .from('user_profiles')
    .insert({
      username: guestProfile.username,
      avatar: guestProfile.avatarUrl,
      favorite_locations: ['Bielefeld']
    })
    .then(() => console.log('Guest profile saved to database'));
  
  return guestProfile;
};

export const TribeApp: React.FC = () => {
  // Check if onboarding was completed
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('tribe_onboarding_completed') !== 'true';
  });
  
  // Check if welcome page should be shown (after onboarding, before app)
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [pendingUserName, setPendingUserName] = useState<string>('');

  // Initialize profile from storage or create guest immediately (synchronous!)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const savedProfile = localStorage.getItem("tribe_user_profile");
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile);
      } catch {
        // Invalid JSON - create new guest
      }
    }
    // No saved profile - create guest instantly
    const guestProfile = createGuestProfileSync();
    localStorage.setItem("tribe_user_profile", JSON.stringify(guestProfile));
    return guestProfile;
  });

  const handleOnboardingComplete = (data: { name: string; interests: string[]; firstAction: 'connect' | 'explore' }) => {
    // Update user profile with name
    const updatedProfile: UserProfile = {
      ...userProfile,
      username: data.name,
      interests: data.interests
    };
    
    setUserProfile(updatedProfile);
    localStorage.setItem("tribe_user_profile", JSON.stringify(updatedProfile));
    localStorage.setItem("chat_username", data.name);
    
    // Save to database
    supabase
      .from('user_profiles')
      .upsert({
        username: data.name,
        avatar: updatedProfile.avatarUrl,
        interests: data.interests,
        favorite_locations: ['Bielefeld']
      }, { onConflict: 'username' })
      .then(() => console.log('Profile saved after onboarding'));
    
    // Show welcome page instead of going directly to app
    setPendingUserName(data.name);
    setShowOnboarding(false);
    setShowWelcome(true);
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  if (showOnboarding) {
    return <OnboardingWorkflow onComplete={handleOnboardingComplete} />;
  }

  if (showWelcome) {
    return <WelcomePage userName={pendingUserName || userProfile.username} onContinue={handleWelcomeComplete} />;
  }

  return (
    <TribeAppMain userProfile={userProfile} setUserProfile={setUserProfile} />
  );
};

// Main app component - always has userProfile (never null)
const TribeAppMain: React.FC<{
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}> = ({ userProfile, setUserProfile }) => {
  // Onboarding flow
  const { currentStep, isOnboarding, advanceStep, setStep, completeOnboarding, markProfileComplete, markGreetingPosted, generateGreeting, isCommunityOnboarding, shouldAvatarBlink } = useOnboardingFlow();
  
  // Always start in COMMUNITY view (main page)
  const [view, setView] = useState<ViewState>(ViewState.COMMUNITY);
  
  // Track if user has seen interests dialog on Explore page
  const [showInterestsDialog, setShowInterestsDialog] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    return userProfile?.homebase || "Bielefeld";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const saved = localStorage.getItem("tribe_selected_category");
    // Default to "FÜR MICH" if user has preferred categories from onboarding
    if (!saved) {
      const hasPreferred = localStorage.getItem('tribe_preferred_categories');
      return hasPreferred ? "FÜR MICH" : "ALL";
    }
    return saved;
  });
  
  // "FÜR MICH" filter is now integrated into selectedCategory
  const [isCityMenuOpen, setIsCityMenuOpen] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [loadedEventCount, setLoadedEventCount] = useState(0);
  const PAGE_SIZE = 50;

  // Event tracking state
  const [hiddenEventIds, setHiddenEventIds] = useState<Set<string>>(new Set());
  const [likedEventIds, setLikedEventIds] = useState<Set<string>>(new Set());
  const [attendingEventIds, setAttendingEventIds] = useState<Set<string>>(new Set());
  const [eventMatchScores, setEventMatchScores] = useState<Map<string, number>>(new Map());

  // Collapsible category groups (Hochschulsport, VHS, Kino)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Collapsed day sections state (for compact mode after first like)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [hasLikedFirstEvent, setHasLikedFirstEvent] = useState<boolean>(() => {
    return localStorage.getItem("tribe_has_first_like") === "true";
  });
  const [showLikeTutorial, setShowLikeTutorial] = useState<boolean>(() => {
    return localStorage.getItem("tribe_seen_like_tutorial") !== "true";
  });
  const { toast } = useToast();
  
  // Sign out handler
  const handleSignOut = () => {
    // Clear all tribe-related localStorage
    localStorage.removeItem('tribe_user_profile');
    localStorage.removeItem('tribe_welcome_completed');
    localStorage.removeItem('tribe_liked_events');
    localStorage.removeItem('tribe_hidden_events');
    localStorage.removeItem('tribe_attending_events');
    localStorage.removeItem('tribe_preferred_categories');
    localStorage.removeItem('tribe_onboarding_completed');
    localStorage.removeItem('tribe_has_first_like');
    localStorage.removeItem('chat_username');
    localStorage.removeItem('chat_avatar');
    
    // Reload the page to reset the app state
    window.location.reload();
  };
  const [locationBlockDialog, setLocationBlockDialog] = useState<{ open: boolean; location: string | null }>({
    open: false,
    location: null,
  });
  const [profileDialog, setProfileDialog] = useState<{
    open: boolean;
    profile: ChatUserProfile | null;
    loading: boolean;
  }>({
    open: false,
    profile: null,
    loading: false,
  });

  // MIA inline state - replaces old Nexus state
  const [miaFilteredEventIds, setMiaFilteredEventIds] = useState<string[] | null>(null);

  // Query history
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  const [allEvents, setAllEvents] = useState<TribeEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // New message notification state
  const [hasNewCommunityMessages, setHasNewCommunityMessages] = useState(false);

  const [showProfileHint, setShowProfileHint] = useState<boolean>(false);

  // Check if user profile is complete (has avatar, interests, and locations)
  const isProfileComplete = (profile: UserProfile | null): boolean => {
    if (!profile) return false;
    const hasAvatar = !!profile.avatarUrl || !!profile.avatar;
    const hasInterests = (profile.interests?.length || 0) > 0;
    const hasLocations = (profile.favorite_locations?.length || 0) > 0;
    const isNotGuest = !profile.username?.startsWith("Guest_");
    return hasAvatar && hasInterests && hasLocations && isNotGuest;
  };

  // Initialize preferences (auth already handled in parent)
  useEffect(() => {
    const hasSeenProfileHint = localStorage.getItem("tribe_seen_profile_hint");

    // Show profile hint if profile is incomplete and hint not dismissed
    if (!isProfileComplete(userProfile) && !hasSeenProfileHint) {
      setShowProfileHint(true);
      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setShowProfileHint(false);
        localStorage.setItem("tribe_seen_profile_hint", "true");
      }, 10000);
    }

    const savedLikes = localStorage.getItem("tribe_liked_events");
    const savedHidden = localStorage.getItem("tribe_hidden_events");
    const savedAttending = localStorage.getItem("tribe_attending_events");
    const savedHistory = localStorage.getItem("tribe_query_history");

    if (savedLikes) setLikedEventIds(new Set(JSON.parse(savedLikes)));
    if (savedHidden) setHiddenEventIds(new Set(JSON.parse(savedHidden)));
    if (savedAttending) setAttendingEventIds(new Set(JSON.parse(savedAttending)));
    if (savedHistory) setQueryHistory(JSON.parse(savedHistory));
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem("tribe_liked_events", JSON.stringify(Array.from(likedEventIds)));
  }, [likedEventIds]);

  useEffect(() => {
    localStorage.setItem("tribe_hidden_events", JSON.stringify(Array.from(hiddenEventIds)));
  }, [hiddenEventIds]);

  useEffect(() => {
    localStorage.setItem("tribe_attending_events", JSON.stringify(Array.from(attendingEventIds)));
  }, [attendingEventIds]);

  useEffect(() => {
    localStorage.setItem("tribe_query_history", JSON.stringify(queryHistory));
  }, [queryHistory]);

  useEffect(() => {
    localStorage.setItem("tribe_selected_category", selectedCategory);
  }, [selectedCategory]);


  // Check for new community messages on app start
  useEffect(() => {
    checkForNewMessages();
  }, []);

  useEffect(() => {
    // Initial load: first 50 events
    setAllEvents([]);
    setLoadedEventCount(0);
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

  // Recalculate match scores when welcome is completed (categories selected)
  useEffect(() => {
    const handleWelcomeComplete = () => {
      console.log('🔄 Welcome completed - recalculating match scores');
      recalculateMatchScores();
    };
    
    window.addEventListener('tribe_welcome_completed', handleWelcomeComplete);
    return () => window.removeEventListener('tribe_welcome_completed', handleWelcomeComplete);
  }, [allEvents]);

  const checkForNewMessages = async () => {
    try {
      const lastSeenTimestamp = localStorage.getItem("tribe_last_seen_community");

      // Fetch latest community message
      const { data, error } = await supabase
        .from("chat_messages")
        .select("created_at")
        .eq("group_id", "tribe_community_board")
        .order("created_at", { ascending: false })
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
      console.error("Error checking for new messages:", error);
    }
  };

  const markCommunityAsSeen = () => {
    localStorage.setItem("tribe_last_seen_community", new Date().toISOString());
    setHasNewCommunityMessages(false);
  };

  const handleViewChange = (newView: ViewState) => {
    setView(newView);
    if (newView === ViewState.COMMUNITY) {
      markCommunityAsSeen();
    }
    // When navigating to Explore (FEED), permanently dismiss the welcome message
    if (newView === ViewState.FEED) {
      localStorage.setItem('tribe_welcome_message_dismissed', 'true');
      
      const hasSeenInterests = localStorage.getItem('tribe_seen_interests_dialog') === 'true';
      const hasPreferredCategories = localStorage.getItem('tribe_preferred_categories');
      if (!hasSeenInterests && !hasPreferredCategories) {
        setShowInterestsDialog(true);
      }
    }
  };

  const fetchEvents = async (isInitial = false, specificDate?: Date) => {
    try {
      if (isLoadingMore && !isInitial) return;
      setIsLoadingMore(true);

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const cityLower = selectedCity.toLowerCase();
      const cityAbbr = cityLower.substring(0, 2);
      const isGermanyWide = selectedCity === "Deutschland";

      if (specificDate) {
        // Calendar picker: load all events for that specific month
        const monthStart = new Date(specificDate.getFullYear(), specificDate.getMonth(), 1);
        const monthEnd = new Date(specificDate.getFullYear(), specificDate.getMonth() + 1, 0);
        const startDate = monthStart.toISOString().split("T")[0];
        const endDate = monthEnd.toISOString().split("T")[0];
        
        console.log("🔄 [fetchEvents] Calendar load for month:", startDate, "to", endDate);
        
        let query = supabase
          .from("community_events")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true });

        // Only filter by city if not "Deutschland"
        if (!isGermanyWide) {
          query = query.or(`city.is.null,city.ilike.${selectedCity},city.ilike.${cityAbbr}`);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        const tribeEvents = (data || []).map(convertToTribeEvent);
        
        // Merge with existing events
        setAllEvents((prev) => {
          const merged = [...prev, ...tribeEvents];
          const unique = Array.from(new Map(merged.map((e) => [e.id, e])).values());
          return unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
      } else if (isInitial) {
        // IMPROVED: Initial load - fetch at least 7 days of events + ensure TRIBE events are included
        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        const sevenDaysStr = sevenDaysLater.toISOString().split("T")[0];
        
        console.log("🔄 [fetchEvents] Initial load: 7 days from", todayStr, "to", sevenDaysStr);
        
        // Load first 7 days
        let weekQuery = supabase
          .from("community_events")
          .select("*")
          .gte("date", todayStr)
          .lte("date", sevenDaysStr)
          .order("date", { ascending: true });

        if (!isGermanyWide) {
          weekQuery = weekQuery.or(`city.is.null,city.ilike.${selectedCity},city.ilike.${cityAbbr}`);
        }

        const { data: weekData, error: weekError } = await weekQuery;

        if (weekError) throw weekError;
        
        // Only fetch the NEXT upcoming Kennenlernabend and Tuesday Run (not all 30 days)
        const nextWeekDate = new Date(today);
        nextWeekDate.setDate(nextWeekDate.getDate() + 10);
        const nextWeekStr = nextWeekDate.toISOString().split("T")[0];
        
        let tribeQuery = supabase
          .from("community_events")
          .select("*")
          .gte("date", todayStr)
          .lte("date", nextWeekStr)
          .or("title.ilike.%TRIBE KENNENLERNABEND%,title.ilike.%TRIBE TUESDAY RUN%,title.ilike.%tribe stammtisch%")
          .limit(2);

        if (!isGermanyWide) {
          tribeQuery = tribeQuery.or(`city.is.null,city.ilike.${selectedCity},city.ilike.${cityAbbr}`);
        }

        const { data: tribeData } = await tribeQuery;
        
        console.log("🔄 [fetchEvents] Week events:", weekData?.length, "Featured TRIBE events:", tribeData?.length);
        
        // Merge week events with tribe events
        const allData = [...(weekData || []), ...(tribeData || [])];
        const uniqueData = Array.from(new Map(allData.map((e) => [e.id, e])).values());
        
        const tribeEvents = uniqueData.map(convertToTribeEvent);
        
        setAllEvents(tribeEvents);
        setLoadedEventCount(tribeEvents.length);
        setHasMoreEvents(true); // There's always more after 7 days
      } else {
        // Pagination: load next batch after day 7
        const offset = loadedEventCount;
        
        console.log("🔄 [fetchEvents] Pagination load, offset:", offset, "limit:", PAGE_SIZE);
        
        let query = supabase
          .from("community_events")
          .select("*")
          .gte("date", todayStr)
          .order("date", { ascending: true })
          .range(offset, offset + PAGE_SIZE - 1);

        // Only filter by city if not "Deutschland"
        if (!isGermanyWide) {
          query = query.or(`city.is.null,city.ilike.${selectedCity},city.ilike.${cityAbbr}`);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        console.log("🔄 [fetchEvents] Received:", data?.length, "events");
        
        const tribeEvents = (data || []).map(convertToTribeEvent);
        
        // Append for infinite scroll
        setAllEvents((prev) => {
          const merged = [...prev, ...tribeEvents];
          const unique = Array.from(new Map(merged.map((e) => [e.id, e])).values());
          return unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        setLoadedEventCount((prev) => prev + tribeEvents.length);
        
        // No more events if we got less than PAGE_SIZE
        setHasMoreEvents(tribeEvents.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadMoreEvents = () => {
    console.log("🔄 [loadMoreEvents] Called, isLoadingMore:", isLoadingMore, "hasMoreEvents:", hasMoreEvents, "loadedEventCount:", loadedEventCount);
    if (!isLoadingMore && hasMoreEvents) {
      fetchEvents(false);
    }
  };

  const loadPosts = () => {
    const mockPosts: Post[] = [
      {
        id: "1",
        user: "Sarah_M",
        text: "Who's hitting the Jazz Night at Ringlokschuppen tonight? 🎷",
        city: selectedCity,
        likes: 12,
        time: "2h ago",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tags: ["jazz", "ausgehen"],
        userAvatar: "/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png",
        comments: [],
      },
    ];
    setPosts(mockPosts);
  };

  const filteredEvents = useMemo(() => {
    const isGermanyWide = selectedCity === "Deutschland";
    // For Deutschland, show all events; otherwise filter by city
    let result = isGermanyWide 
      ? [...allEvents] 
      : allEvents.filter((e) => {
          const eventCity = (e.city || "").toLowerCase();
          const cityLower = selectedCity.toLowerCase();
          const cityAbbr = cityLower.substring(0, 2);
          return eventCity === cityLower || eventCity === cityAbbr || !e.city;
        });

    // Remove hidden events
    result = result.filter((e) => !hiddenEventIds.has(e.id));

    // Remove blocked locations
    result = result.filter((e) => !e.location || !dislikeService.isLocationBlocked(e.location));

    // Only show events with images (except grouped categories which are handled in render)
    result = result.filter((e) => {
      const title = (e.title || '').toLowerCase();
      const location = (e.location || '').toLowerCase();
      const organizer = (e.organizer || '').toLowerCase();
      const category = (e.category || '').toLowerCase();
      
      // These categories will be shown as collapsible groups — keep them regardless of image
      const isGroupedCategory = 
        title.includes('hochschulsport') || organizer.includes('hochschulsport') ||
        title.includes('vhs') || title.includes('volkshochschule') || location.includes('vhs') || location.includes('volkshochschule') ||
        location.includes('johannesstift') || location.includes('jöllenbeck') ||
        title.includes('wochenmarkt') ||
        title.includes('kino') || location.includes('kino') || location.includes('lichtwerk') || location.includes('cinemaxx') || location.includes('cinestar') || location.includes('filmhaus') ||
        category === 'sport';
      
      if (isGroupedCategory) return true; // Keep for collapsible groups
      
      // Must have image for regular events
      if (!e.image_url) return false;
      
      // Cutie
      if (title.includes('cutie') || organizer.includes('cutie')) return false;
      // liv / Hinterzimmer
      if (title.includes('liv ') || title.includes('liv/') || location.includes('hinterzimmer') || title.includes('hinterzimmer') || organizer.includes('hinterzimmer')) return false;
      // Salsa
      if (title.includes('salsa')) return false;
      // Pub Quiz
      if (title.includes('pub quiz') || title.includes('pubquiz') || title.includes('quiz night')) return false;
      // Karaoke
      if (title.includes('karaoke')) return false;
      // Afterwork
      if (title.includes('afterwork') || title.includes('after work') || title.includes('after-work')) return false;
      
      return true;
    });

    // Filter by selected date from calendar picker
    if (selectedDate) {
      const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
      console.log("🔄 [TribeApp filteredEvents] Filtering by date:", selectedDateStr);
      console.log("🔄 [TribeApp filteredEvents] Before date filter:", result.length);
      result = result.filter((e) => {
        const matches = e.date === selectedDateStr;
        if (!matches) {
          console.log("🔄 Date mismatch:", e.date, "vs", selectedDateStr, "for event:", e.title);
        }
        return matches;
      });
      console.log("🔄 [TribeApp filteredEvents] After date filter:", result.length);
    }

    // Filter by category (skip for "ALL" and "FÜR MICH" which have their own logic)
    if (selectedCategory !== "ALL" && selectedCategory !== "FÜR MICH") {
      result = result.filter((e) => {
        const category = e.category || "";
        const title = (e.title || "").toLowerCase();
        const location = (e.location || "").toLowerCase();
        
        // Direct category match
        if (category.toUpperCase() === selectedCategory) return true;
        
        // Map category groups
        const categoryGroup = getCategoryGroup(category);
        
        // ART filter - match Kreativität group and keywords
        if (selectedCategory === "ART") {
          if (categoryGroup === "Kreativität") return true;
          // Check for art/kreativ keywords in title/location
          const artKeywords = ['kreativ', 'kunst', 'art', 'theater', 'impro', 'workshop', 'vhs', 'volkshochschule', 'ausstellung', 'lesung', 'comedy', 'kabarett', 'krakeln', 'malen', 'zeichnen', 'creative'];
          return artKeywords.some(kw => title.includes(kw) || location.includes(kw));
        }
        
        // PARTY filter - exclude VHS/Volkshochschule events (they belong to Kreativität)
        if (selectedCategory === "PARTY") {
          const excludeKeywords = ['vhs', 'volkshochschule', 'workshop', 'kurs', 'seminar', 'kreativ', 'malen', 'zeichnen'];
          if (excludeKeywords.some(kw => title.includes(kw) || location.includes(kw))) return false;
          
          if (categoryGroup === "Ausgehen") return true;
          const partyKeywords = ['party', 'club', 'disco', 'dj', 'techno', 'house'];
          return partyKeywords.some(kw => title.includes(kw) || location.includes(kw));
        }
        
        // CONCERT filter
        if (selectedCategory === "CONCERT") {
          const concertKeywords = ['konzert', 'concert', 'live', 'band', 'musik'];
          return concertKeywords.some(kw => title.includes(kw) || location.includes(kw));
        }
        
        // SPORT filter
        if (selectedCategory === "SPORT") {
          if (categoryGroup === "Sport") return true;
          const sportKeywords = ['sport', 'fitness', 'yoga', 'lauf', 'run', 'training', 'hochschulsport'];
          return sportKeywords.some(kw => title.includes(kw) || location.includes(kw));
        }
        
        return false;
      });
    }

    // Filter by user's preferred categories from onboarding ("FÜR MICH" filter)
    if (selectedCategory === "FÜR MICH") {
      const preferredCategories = JSON.parse(localStorage.getItem('tribe_preferred_categories') || '[]') as string[];
      console.log('🔍 FÜR MICH Filter - preferredCategories:', preferredCategories, 'events before:', result.length);
      
      if (preferredCategories.length > 0) {
        result = result.filter((e) => {
          const category = (e.category || "").toLowerCase();
          const title = (e.title || "").toLowerCase();
          const location = (e.location || "").toLowerCase();
          const categoryGroup = getCategoryGroup(e.category || '');
          
          return preferredCategories.some((pref) => {
            const prefLower = pref.toLowerCase();
            
            // Match ausgehen preference
            if (prefLower === 'ausgehen' || prefLower === 'party') {
              if (categoryGroup === 'Ausgehen') return true;
              const ausgehenKeywords = ['party', 'club', 'disco', 'dj', 'bar', 'kneipe', 'festival', 'konzert', 'concert', 'live'];
              if (ausgehenKeywords.some(kw => title.includes(kw) || location.includes(kw) || category.includes(kw))) return true;
            }
            
            // Match kreativitaet preference
            if (prefLower === 'kreativitaet' || prefLower === 'kreativität' || prefLower === 'kultur') {
              if (categoryGroup === 'Kreativität') return true;
              const artKeywords = ['kreativ', 'kunst', 'art', 'theater', 'impro', 'workshop', 'vhs', 'volkshochschule', 'ausstellung', 'lesung', 'comedy', 'kabarett', 'malen', 'zeichnen', 'krakeln', 'kultur', 'museum'];
              if (artKeywords.some(kw => title.includes(kw) || location.includes(kw) || category.includes(kw))) return true;
            }
            
            // Match sport preference  
            if (prefLower === 'sport') {
              if (categoryGroup === 'Sport') return true;
              const sportKeywords = ['sport', 'fitness', 'yoga', 'lauf', 'run', 'training', 'hochschulsport', 'schwimmen', 'fußball', 'basketball', 'tennis'];
              if (sportKeywords.some(kw => title.includes(kw) || location.includes(kw) || category.includes(kw))) return true;
            }
            
            // Match konzerte preference
            if (prefLower === 'konzerte' || prefLower === 'konzert') {
              const concertKeywords = ['konzert', 'concert', 'live', 'band', 'musik', 'open air'];
              if (concertKeywords.some(kw => title.includes(kw) || location.includes(kw) || category.includes(kw))) return true;
            }
            
            // Direct category match
            if (category.includes(prefLower)) return true;
            
            return false;
          });
        });
        console.log('🔍 FÜR MICH Filter - events after:', result.length);
      } else {
        // No preferences saved - show all events as fallback
        console.log('🔍 FÜR MICH Filter - no preferences saved, showing all events');
      }
    }

    // Apply MIA filter if active (replaces old nexusFilter)
    // CRITICAL: Check for non-empty array - empty array should NOT filter
    if (miaFilteredEventIds && miaFilteredEventIds.length > 0) {
      result = result.filter((e) => miaFilteredEventIds.includes(e.id));
    }

    // Helper function to detect "Ausgehen" events by keywords
    const isAusgehenEvent = (event: TribeEvent): boolean => {
      const category = (event.category || "").toLowerCase();
      const title = (event.title || "").toLowerCase();
      const location = (event.location || "").toLowerCase();

      // Check category first - including "Sonstiges"
      if (["ausgehen", "party", "konzert", "concert", "sonstiges", "other"].includes(category)) {
        return true;
      }

      // Check for ausgehen keywords in title or location
      const ausgehenKeywords = [
        "party",
        "club",
        "konzert",
        "concert",
        "bar",
        "kneipe",
        "disco",
        "festival",
        "live",
        "dj",
        "techno",
        "house",
        "punk",
        "rock",
        "jazz",
        "blues",
        "open air",
        "club",
        "tanzveranstaltung",
        "tanzen",
        "kulturzentrum",
        "forum",
        "ringlokschuppen",
        "bunker",
        "nachtleben",
      ];

      return ausgehenKeywords.some((keyword) => title.includes(keyword) || location.includes(keyword));
    };

    // Helper: Check if event is a featured Tribe Community Event (always shown first)
    const isFeaturedTribeEvent = (event: TribeEvent): boolean => {
      const title = event.title?.toLowerCase() || '';
      // Match all variations of TRIBE community events
      return title.includes('tribe kennenlernabend') || 
             title.includes('tribe stammtisch') || 
             title.includes('kennenlernabend') || 
             title.includes('tribe tuesday run') ||
             title.includes('tuesday run') ||
             title.includes('dienstagslauf');
    };

    // Sort: Date first, then match score within each day
    result.sort((a, b) => {
      // PRIORITY 1: Sort by date (ascending) — always first
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;

      // --- Within same day ---

      // PRIORITY 2: Featured Tribe Community Events first within their day
      const isFeaturedA = isFeaturedTribeEvent(a);
      const isFeaturedB = isFeaturedTribeEvent(b);
      if (isFeaturedA && !isFeaturedB) return -1;
      if (!isFeaturedA && isFeaturedB) return 1;

      // PRIORITY 3: Tribe/Community events first
      const isTribeA = a.source === 'community' || a.source === 'tribe';
      const isTribeB = b.source === 'community' || b.source === 'tribe';
      if (isTribeA && !isTribeB) return -1;
      if (!isTribeA && isTribeB) return 1;

      // PRIORITY 4: Match score (higher = better)
      const scoreA = eventMatchScores.get(a.id) || a.matchScore || 0;
      const scoreB = eventMatchScores.get(b.id) || b.matchScore || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;

      // PRIORITY 5: Liked events
      const isLikedA = likedEventIds.has(a.id);
      const isLikedB = likedEventIds.has(b.id);
      if (isLikedA && !isLikedB) return -1;
      if (!isLikedA && isLikedB) return 1;

      // PRIORITY 6: Events with images first
      const hasImageA = !!a.image_url;
      const hasImageB = !!b.image_url;
      if (hasImageA && !hasImageB) return -1;
      if (!hasImageA && hasImageB) return 1;

      // PRIORITY 7: Sort by time
      const timeA = a.time || "00:00";
      const timeB = b.time || "00:00";
      return timeA.localeCompare(timeB);
    });

    return result;
  }, [allEvents, selectedCity, selectedCategory, hiddenEventIds, likedEventIds, miaFilteredEventIds, selectedDate]);

  // State for infinite scroll in hero section
  const [heroLoadedCount, setHeroLoadedCount] = useState(10);

  // Get top events sorted by match score for hero section (infinite scroll)
  const spotlightEvents = useMemo(() => {
    // Exclude collapsible group events from hero
    const nonGrouped = filteredEvents.filter(e => {
      const title = (e.title || '').toLowerCase();
      const location = (e.location || '').toLowerCase();
      const organizer = (e.organizer || '').toLowerCase();
      const category = (e.category || '').toLowerCase();
      if (title.includes('hochschulsport') || organizer.includes('hochschulsport')) return false;
      if (category === 'sport') return false;
      if (title.includes('vhs') || title.includes('volkshochschule') || location.includes('vhs') || location.includes('volkshochschule') || location.includes('johannesstift') || location.includes('jöllenbeck') || title.includes('wochenmarkt')) return false;
      if (title.includes('kino') || location.includes('kino') || location.includes('lichtwerk') || location.includes('cinemaxx') || location.includes('cinestar') || location.includes('filmhaus')) return false;
      return true;
    });
    const grouped = groupSimilarEvents(nonGrouped);
    
    // Sort by date first, then match score within each day
    const sorted = [...grouped].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      const scoreA = eventMatchScores.get(a.id) || 50;
      const scoreB = eventMatchScores.get(b.id) || 50;
      return scoreB - scoreA;
    });
    
    return sorted.slice(0, heroLoadedCount);
  }, [filteredEvents, eventMatchScores, heroLoadedCount]);

  // Load more hero events when scrolling
  const handleHeroScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollEnd = target.scrollWidth - target.scrollLeft - target.clientWidth;
    
    // Load more when near the end
    if (scrollEnd < 200 && heroLoadedCount < filteredEvents.length) {
      setHeroLoadedCount(prev => Math.min(prev + 10, filteredEvents.length));
    }
  };

  // Get top events for live ticker (highest score)
  const tickerTopEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    // Filter events within next 30 days, exclude Sport/VHS/Kino
    const next30DaysEvents = allEvents.filter(e => {
      const eventDate = new Date(e.date);
      if (eventDate < today || eventDate >= thirtyDaysLater) return false;
      
      const title = (e.title || '').toLowerCase();
      const location = (e.location || '').toLowerCase();
      const organizer = (e.organizer || '').toLowerCase();
      const category = (e.category || '').toLowerCase();
      
      // Exclude Sport
      if (category === 'sport') return false;
      if (title.includes('hochschulsport') || organizer.includes('hochschulsport')) return false;
      
      // Exclude VHS
      if (title.includes('vhs') || title.includes('volkshochschule') || location.includes('vhs') || location.includes('volkshochschule') || location.includes('johannesstift') || location.includes('jöllenbeck')) return false;
      
      // Exclude Kino
      if (title.includes('kino') || location.includes('kino') || location.includes('lichtwerk') || location.includes('cinemaxx') || location.includes('cinestar') || location.includes('filmhaus')) return false;
      
      return true;
    });
    
    // Sort by match score
    return [...next30DaysEvents].sort((a, b) => {
      const scoreA = eventMatchScores.get(a.id) || 50;
      const scoreB = eventMatchScores.get(b.id) || 50;
      return scoreB - scoreA;
    });
  }, [allEvents, eventMatchScores]);

  const feedEvents = filteredEvents; // Show all events in feed, including spotlight events (sorted by match score)

  const handleLogin = (profile: UserProfile) => {
    // Save profile locally and update state immediately (no waiting)
    setUserProfile(profile);
    if (profile.homebase) setSelectedCity(profile.homebase);
    localStorage.setItem("tribe_user_profile", JSON.stringify(profile));

    // Fire-and-forget: Create profile in DB in background
    supabase.functions.invoke("manage_user_profile", {
      body: {
        action: "createOrUpdateProfile",
        profile: {
          username: profile.username,
          avatar: profile.avatarUrl,
          interests: [],
          favorite_locations: profile.homebase ? [profile.homebase] : [],
          hobbies: [],
        },
      },
    }).then(({ error }) => {
      if (error) {
        console.error("Error creating user profile:", error);
      } else {
        console.log("User profile created in background");
      }
    }).catch((error) => {
      console.error("Unexpected error during profile creation:", error);
    });
  };

  const recalculateMatchScores = () => {
    const scores = new Map<string, number>();
    allEvents.forEach((event) => {
      const score = personalizationService.calculateMatchScore(event);
      scores.set(event.id, score);
    });
    setEventMatchScores(scores);
  };

  const handleInteraction = async (eventId: string, type: "like" | "dislike") => {
    const event = allEvents.find((e) => e.id === eventId);

    if (type === "dislike") {
      // Find all events with the same title (grouped events) and hide them all at once
      const eventTitle = event?.title?.toLowerCase().trim();
      const idsToHide = eventTitle
        ? allEvents
            .filter(e => e.title?.toLowerCase().trim() === eventTitle)
            .map(e => e.id)
        : [eventId];
      
      console.log(`🚫 Hiding ${idsToHide.length} events with title "${eventTitle}"`, idsToHide);
      
      setHiddenEventIds((prev) => {
        const newSet = new Set(prev);
        idsToHide.forEach(id => newSet.add(id));
        return newSet;
      });

      // Track dislike for personalization
      if (event) {
        personalizationService.trackDislike(event);
      }

      // Dislike all grouped events in the service
      for (const id of idsToHide) {
        await dislikeService.dislikeEvent(id, event?.location || undefined);
      }

      const { shouldAskBlock, location } = await dislikeService.dislikeEvent(eventId, event?.location || undefined);

      if (shouldAskBlock && location) {
        setLocationBlockDialog({ open: true, location });
      }

      // Recalculate match scores after dislike
      recalculateMatchScores();
    } else if (type === "like") {
      const isFirstLike = !hasLikedFirstEvent && likedEventIds.size === 0;
      const isOnboardingWaitingForLike = isOnboarding && currentStep === 'waiting_for_like';

      setLikedEventIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(eventId)) {
          newSet.delete(eventId);
        } else {
          newSet.add(eventId);

          // During onboarding waiting_for_like step - switch to community
          if (isOnboardingWaitingForLike) {
            setStep('community_intro');
            // Also mark first like so feed collapses
            setHasLikedFirstEvent(true);
            localStorage.setItem("tribe_has_first_like", "true");
            // Toast removed - MIA greets in community view instead
            setTimeout(() => setView(ViewState.COMMUNITY), 1000);
          } else if (isFirstLike) {
            // First like ever (non-onboarding) - collapse the feed
            setHasLikedFirstEvent(true);
            localStorage.setItem("tribe_has_first_like", "true");
            toast({
              title: "Feed optimiert! ✨",
              description: "Deine Favoriten stehen jetzt oben. Tippe 'Mehr anzeigen' um alle Events zu sehen.",
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
        description: `Events von "${locationBlockDialog.location}" werden nicht mehr angezeigt.`,
      });
      setLocationBlockDialog({ open: false, location: null });
    }
  };

  const handleCancelBlock = () => {
    setLocationBlockDialog({ open: false, location: null });
  };

  const handleToggleAttendance = async (eventId: string) => {
    const isCurrentlyAttending = attendingEventIds.has(eventId);
    
    setAttendingEventIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });

    // Persist to database
    try {
      const username = userProfile?.username || 'anonymous';
      
      // Fetch current state from DB
      const { data: currentEvent } = await supabase
        .from('community_events')
        .select('rsvp_yes, liked_by_users')
        .eq('id', eventId)
        .single();
      
      if (currentEvent) {
        const currentRsvp = currentEvent.rsvp_yes || 0;
        const newRsvp = isCurrentlyAttending ? Math.max(0, currentRsvp - 1) : currentRsvp + 1;
        const currentLikedBy = (currentEvent.liked_by_users as string[]) || [];
        const newLikedBy = isCurrentlyAttending
          ? currentLikedBy.filter((u: string) => u !== username)
          : [...currentLikedBy, username];
        
        const { error } = await supabase
          .from('community_events')
          .update({ 
            rsvp_yes: newRsvp,
            liked_by_users: newLikedBy
          })
          .eq('id', eventId);
        
        if (error) {
          console.error('Error saving RSVP:', error);
        } else {
          console.log(`✅ RSVP ${isCurrentlyAttending ? 'removed' : 'saved'} for event ${eventId}`);
        }
      }
    } catch (err) {
      console.error('Error toggling attendance:', err);
    }
  };

  const handleTickerEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const handleQuery = (query: string) => {
    setQueryHistory((prev) => [query, ...prev.filter((q) => q !== query)].slice(0, 20));
  };

  // handleNexusAsk removed - MIA is now handled by MiaInlineChat component

  const handleMiaEventsFiltered = (eventIds: string[]) => {
    setMiaFilteredEventIds(eventIds);
  };

  const handleMiaClearFilter = () => {
    setMiaFilteredEventIds(null);
  };

  // Handle interests selected during onboarding
  const handleInterestsSelected = (interests: string[]) => {
    // Save interests to profile
    if (userProfile) {
      const updatedProfile = {
        ...userProfile,
        interests: interests,
      };
      setUserProfile(updatedProfile);
      localStorage.setItem("tribe_user_profile", JSON.stringify(updatedProfile));
      
      // Save to localStorage for personalization
      localStorage.setItem("tribe_user_interests", JSON.stringify(interests));
      
      // CRITICAL: Save to preferred categories key for score calculation
      localStorage.setItem("tribe_preferred_categories", JSON.stringify(interests));
      
      // Fire-and-forget update to database
      supabase
        .from('user_profiles')
        .update({ interests: interests })
        .eq('username', userProfile.username)
        .then(() => console.log('Interests saved to database'));
    }
  };

  const handleJoinTribe = (eventName: string) => {
    if (!userProfile) return;
    const newPost: Post = {
      id: Date.now().toString(),
      user: userProfile.username,
      text: `Who is going to "${eventName}"? Looking for tribe members!`,
      city: selectedCity,
      likes: 0,
      time: "Just now",
      timestamp: new Date().toISOString(),
      tags: ["TribeCall"],
      userAvatar: userProfile.avatarUrl,
    };
    setPosts([newPost, ...posts]);
    setView(ViewState.COMMUNITY);
  };

  const attendingEvents = allEvents.filter((e) => attendingEventIds.has(e.id));
  const likedEvents = allEvents.filter((e) => likedEventIds.has(e.id));

  // No longer need AUTH view - WelcomeOverlay is shown as overlay in parent

  // People List dialog state
  const [showPeopleList, setShowPeopleList] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white pb-24 overflow-x-hidden relative font-sans selection:bg-gold selection:text-black">
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/5 max-w-2xl mx-auto">
        <div className="px-6 py-4 flex justify-between items-center">
          {/* THE TRIBE LOGO */}
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6">
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22H22L12 2Z" className="fill-white" />
                <circle cx="12" cy="14" r="3" className="fill-black" />
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
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-300 ${isCityMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isCityMenuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-black border border-white/10 min-w-[140px] z-50 shadow-2xl animate-fadeIn">
                  {CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => {
                        setSelectedCity(city);
                        setIsCityMenuOpen(false);
                      }}
                      className="block w-full text-right px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* USER AVATAR with Profile Hint and Onboarding Blink */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileHint(false);
                  localStorage.setItem("tribe_seen_profile_hint", "true");
                  
                  // During onboarding waiting_for_avatar_click step, set to editing_profile and go to PROFILE
                  if (shouldAvatarBlink && currentStep === 'waiting_for_avatar_click') {
                    setStep('editing_profile');
                  }
                  
                  setView(userProfile ? ViewState.PROFILE : ViewState.AUTH);
                }}
                className={`flex items-center gap-2 ${
                  shouldAvatarBlink ? "" : (!isProfileComplete(userProfile) ? "animate-pulse" : "")
                }`}
              >
                <div className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-colors ${
                  shouldAvatarBlink 
                    ? "border-gold animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_15px_rgba(212,175,55,0.7)]" 
                    : (!isProfileComplete(userProfile) ? "border-gold" : "border-white/20 hover:border-gold")
                }`}>
                  {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <User size={20} className="text-zinc-600" />
                    </div>
                  )}
                </div>
                {/* Show "Profil erstellen" text when avatar should blink OR profile is incomplete */}
                {(shouldAvatarBlink || !isProfileComplete(userProfile)) && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block ${
                    shouldAvatarBlink ? "text-gold animate-pulse" : "text-gold"
                  }`}>
                    Profil erstellen
                  </span>
                )}
              </button>

              {/* Profile creation hint tooltip (mobile) */}
              {showProfileHint && !isProfileComplete(userProfile) && (
                <div className="absolute top-full right-0 mt-2 whitespace-nowrap animate-fadeIn sm:hidden">
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

      {/* --- MAIN CONTENT --- */}
      <main
        className="pt-16 px-0 max-w-2xl mx-auto h-screen overflow-y-auto"
      >

        {/* Explore + Community integrated view */}
        {view === ViewState.COMMUNITY && (
          <>
            {/* Explore Section - compact hero + collapsible feed above community */}
            <ExploreSectionCompact
              spotlightEvents={spotlightEvents}
              feedEvents={feedEvents}
              likedEventIds={likedEventIds}
              attendingEventIds={attendingEventIds}
              eventMatchScores={eventMatchScores}
              onInteraction={handleInteraction}
              onToggleAttendance={handleToggleAttendance}
              onJoinTribe={handleJoinTribe}
              onHeroScroll={handleHeroScroll}
              heroLoadedCount={heroLoadedCount}
              totalFilteredCount={filteredEvents.length}
              onViewChange={handleViewChange}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onFetchEventsForDate={(date) => fetchEvents(false, date)}
              allEvents={allEvents}
              miaFilteredEventIds={miaFilteredEventIds}
              onMiaClearFilter={handleMiaClearFilter}
              hasLikedFirstEvent={hasLikedFirstEvent}
              expandedGroups={expandedGroups}
              onToggleGroup={(groupId) => setExpandedGroups(prev => {
                const next = new Set(prev);
                if (next.has(groupId)) next.delete(groupId);
                else next.add(groupId);
                return next;
              })}
            />
            <TribeCommunityBoard
              selectedCity={selectedCity}
              userProfile={userProfile}
              onEditProfile={() => setView(ViewState.PROFILE)}
              onboardingStep={isCommunityOnboarding ? currentStep : undefined}
              onAdvanceOnboarding={advanceStep}
              onMarkProfileComplete={markProfileComplete}
              onMarkGreetingPosted={markGreetingPosted}
              generateGreeting={generateGreeting}
              onProfileClick={async (username) => {
                setProfileDialog({ open: true, profile: null, loading: true });
                try {
                  const { data, error } = await supabase
                    .from("user_profiles")
                    .select("*")
                    .eq("username", username)
                    .maybeSingle();
                  if (error) throw error;
                  setProfileDialog({ open: true, profile: data, loading: false });
                } catch (err) {
                  console.error("Error fetching profile:", err);
                  setProfileDialog({ open: false, profile: null, loading: false });
                }
              }}
            />
          </>
        )}

        {/* User Profile Dialog */}
        <UserProfileDialog
          open={profileDialog.open}
          onOpenChange={(open) => setProfileDialog((prev) => ({ ...prev, open }))}
          userProfile={profileDialog.profile}
          loading={profileDialog.loading}
        />
        {view === ViewState.MAP && (
          <div className="absolute inset-0 pt-16 h-[calc(100vh-80px)]">
            <TribeMapView 
              events={filteredEvents} 
              posts={posts} 
              selectedCity={selectedCity}
              userProfile={{
                username: userProfile.username,
                avatarUrl: userProfile.avatarUrl,
                interests: userProfile.interests
              }}
            />
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
            onOpenMatcher={() => setShowPeopleList(true)}
            onboardingStep={currentStep}
            onSignOut={handleSignOut}
            onProfileUpdate={(updatedProfile) => {
              setUserProfile(updatedProfile);
              // During community onboarding, mark profile complete and go back to community
              if (isCommunityOnboarding && currentStep === 'editing_profile') {
                markProfileComplete();
                setView(ViewState.COMMUNITY);
              }
            }}
          />
        )}
      </main>

      {/* --- MIA NOTIFICATION HUB --- */}
      <MiaNotificationHub
        username={userProfile.username}
        interests={userProfile.interests}
        hobbies={userProfile.hobbies}
        favorite_locations={userProfile.favorite_locations}
        city={selectedCity}
        likedEventIds={Array.from(likedEventIds)}
        attendingEventIds={Array.from(attendingEventIds)}
        events={allEvents}
        onViewEvent={(eventId) => setSelectedEventId(eventId)}
        onOpenChat={() => setView(ViewState.COMMUNITY)}
        onJoinCommunityChat={() => {
          setView(ViewState.COMMUNITY);
          markCommunityAsSeen();
        }}
      />

      {/* --- BOTTOM NAVIGATION --- */}
      <TribeBottomNav
        currentView={view}
        onViewChange={handleViewChange}
        hasNewCommunityMessages={hasNewCommunityMessages}
      />

      {/* --- EVENT DETAIL DIALOG --- */}
      {selectedEventId &&
        (() => {
          const selectedEvent = allEvents.find((e) => e.id === selectedEventId);
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
        location={locationBlockDialog.location || ""}
        onBlock={handleBlockLocation}
        onCancel={handleCancelBlock}
      />

      {/* --- APP DOWNLOAD PROMPT --- */}
      <AppDownloadPrompt />

      {/* --- INTERESTS DIALOG (first visit to Explore) --- */}
      <InterestsDialog
        open={showInterestsDialog}
        onClose={() => setShowInterestsDialog(false)}
        onInterestsSelected={handleInterestsSelected}
      />

      {/* --- PEOPLE LIST DIALOG --- */}
      <PeopleList
        open={showPeopleList}
        onOpenChange={setShowPeopleList}
        currentUsername={userProfile.username}
      />
    </div>
  );
};
