import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ViewState, TribeEvent, Post, UserProfile, NexusFilter } from "@/types/tribe";
import { UserProfile as ChatUserProfile } from "@/types/chatTypes";
import { convertToTribeEvent } from "@/utils/tribe/eventHelpers";
import { TribeEventCard } from "./TribeEventCard";
import { TribeCommunityBoard } from "./TribeCommunityBoard";
import { TribeMapView } from "./TribeMapView";
import { TribeBottomNav } from "./TribeBottomNav";
import { ProfileView } from "./ProfileView";
import { TribeLiveTicker } from "@/components/TribeLiveTicker";
import { LocationBlockDialog } from "./LocationBlockDialog";
import { AppDownloadPrompt } from "./AppDownloadPrompt";
import { TribeUserMatcher } from "./TribeUserMatcher";
import { MiaInlineChat } from "./MiaInlineChat";
import UserProfileDialog from "@/components/users/UserProfileDialog";
import { useOnboardingFlow } from "@/hooks/useOnboardingFlow";

import { dislikeService } from "@/services/dislikeService";
import { personalizationService } from "@/services/personalizationService";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  User,
  X,
  Filter,
  Calendar as CalendarIcon,
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

const CATEGORIES = ["ALL", "PARTY", "ART", "CONCERT", "SPORT"];

const AVATAR_OPTIONS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150&h=150"
];

// Auto-create guest profile for new users
const createGuestProfile = async (): Promise<UserProfile> => {
  try {
    const { data: existingGuests } = await supabase
      .from('user_profiles')
      .select('username')
      .like('username', 'Guest_%')
      .order('created_at', { ascending: false })
      .limit(1);

    let guestNumber = 1;
    if (existingGuests && existingGuests.length > 0) {
      const lastGuest = existingGuests[0].username;
      const match = lastGuest.match(/Guest_(\d+)/);
      if (match) guestNumber = parseInt(match[1]) + 1;
    }

    const guestUsername = `Guest_${guestNumber}`;
    const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
    
    const guestProfile: UserProfile = {
      username: guestUsername,
      avatarUrl: randomAvatar,
      bio: 'Guest',
      homebase: 'Bielefeld'
    };
    
    // Save to database (fire-and-forget)
    supabase
      .from('user_profiles')
      .insert({
        username: guestProfile.username,
        avatar: guestProfile.avatarUrl,
        favorite_locations: ['Bielefeld']
      })
      .then(() => console.log('Guest profile saved to database'));
    
    return guestProfile;
  } catch {
    // Fallback guest profile
    return {
      username: `Guest_${Date.now().toString().slice(-4)}`,
      avatarUrl: AVATAR_OPTIONS[0],
      bio: 'Guest',
      homebase: 'Bielefeld'
    };
  }
};

export const TribeApp: React.FC = () => {
  // Initialize profile from storage or create guest immediately
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const savedProfile = localStorage.getItem("tribe_user_profile");
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Auto-create guest profile on first visit
  useEffect(() => {
    const initGuestProfile = async () => {
      if (!userProfile) {
        const guestProfile = await createGuestProfile();
        localStorage.setItem("tribe_user_profile", JSON.stringify(guestProfile));
        setUserProfile(guestProfile);
      }
    };
    
    initGuestProfile();
  }, []);

  return <TribeAppMain userProfile={userProfile} setUserProfile={setUserProfile} />;
};

// Main app component - only loaded after authentication
const TribeAppMain: React.FC<{
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}> = ({ userProfile, setUserProfile }) => {
  // Onboarding flow
  const { currentStep, isOnboarding, advanceStep, completeOnboarding } = useOnboardingFlow();
  
  // Start in FEED view for onboarding, COMMUNITY otherwise
  const [view, setView] = useState<ViewState>(() => {
    const onboardingCompleted = localStorage.getItem('tribe_onboarding_completed') === 'true';
    return onboardingCompleted ? ViewState.COMMUNITY : ViewState.FEED;
  });
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    return userProfile?.homebase || "Bielefeld";
  });
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    const saved = localStorage.getItem("tribe_selected_category");
    return saved || "ALL";
  });
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

  // Collapsed day sections state (for compact mode after first like)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [hasLikedFirstEvent, setHasLikedFirstEvent] = useState<boolean>(() => {
    return localStorage.getItem("tribe_has_first_like") === "true";
  });
  const [showLikeTutorial, setShowLikeTutorial] = useState<boolean>(() => {
    return localStorage.getItem("tribe_seen_like_tutorial") !== "true";
  });
  const { toast } = useToast();
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
  };

  const fetchEvents = async (isInitial = false, specificDate?: Date) => {
    try {
      if (isLoadingMore && !isInitial) return;
      setIsLoadingMore(true);

      const today = new Date().toISOString().split("T")[0];
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
      } else {
        // Pagination: use offset/limit
        const offset = isInitial ? 0 : loadedEventCount;
        
        console.log("🔄 [fetchEvents] Pagination load, offset:", offset, "limit:", PAGE_SIZE);
        
        let query = supabase
          .from("community_events")
          .select("*")
          .gte("date", today)
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
        
        if (isInitial) {
          setAllEvents(tribeEvents);
          setLoadedEventCount(tribeEvents.length);
        } else {
          // Append for infinite scroll
          setAllEvents((prev) => {
            const merged = [...prev, ...tribeEvents];
            const unique = Array.from(new Map(merged.map((e) => [e.id, e])).values());
            return unique.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          });
          setLoadedEventCount((prev) => prev + tribeEvents.length);
        }
        
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

    // Filter by category
    if (selectedCategory !== "ALL") {
      result = result.filter((e) => e.category?.toUpperCase() === selectedCategory);
    }

    // Apply MIA filter if active (replaces old nexusFilter)
    if (miaFilteredEventIds) {
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
        kreativität: 2,
        art: 2,
        sport: 3,
      };

      const categoryA = categoryOrder[a.category?.toLowerCase() || ""] || 4; // Other categories with images get priority 4
      const categoryB = categoryOrder[b.category?.toLowerCase() || ""] || 4;

      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }

      // Priority 4: Within same category, sort by date and time
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;

      // If same date, sort by time
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
    // Sort all filtered events by match score
    const sorted = [...filteredEvents].sort((a, b) => {
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
    
    // Filter events within next 30 days
    const next30DaysEvents = allEvents.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= today && eventDate < thirtyDaysLater;
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
      setHiddenEventIds((prev) => new Set([...prev, eventId]));

      // Track dislike for personalization
      if (event) {
        personalizationService.trackDislike(event);
      }

      const { shouldAskBlock, location } = await dislikeService.dislikeEvent(eventId, event?.location || undefined);

      if (shouldAskBlock && location) {
        setLocationBlockDialog({ open: true, location });
      }

      // Recalculate match scores after dislike
      recalculateMatchScores();
    } else if (type === "like") {
      const isFirstLike = !hasLikedFirstEvent && likedEventIds.size === 0;

      setLikedEventIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(eventId)) {
          newSet.delete(eventId);
        } else {
          newSet.add(eventId);

          // First like ever - collapse the feed and notify user
          if (isFirstLike) {
            setHasLikedFirstEvent(true);
            localStorage.setItem("tribe_has_first_like", "true");
            
            // During onboarding, switch to Community view
            if (isOnboarding) {
              completeOnboarding();
              toast({
                title: "Super! 🎉",
                description: "Jetzt zeig ich dir die Community. Hier triffst du Leute mit ähnlichem Geschmack!",
              });
              // Switch to Community view after a short delay
              setTimeout(() => setView(ViewState.COMMUNITY), 1000);
            } else {
              toast({
                title: "Feed optimiert! ✨",
                description: "Deine Favoriten stehen jetzt oben. Tippe 'Mehr anzeigen' um alle Events zu sehen.",
              });
            }
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

  const handleToggleAttendance = (eventId: string) => {
    setAttendingEventIds((prev) => {
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
    setQueryHistory((prev) => [query, ...prev.filter((q) => q !== query)].slice(0, 20));
  };

  // handleNexusAsk removed - MIA is now handled by MiaInlineChat component

  const handleMiaEventsFiltered = (eventIds: string[]) => {
    setMiaFilteredEventIds(eventIds);
  };

  const handleMiaClearFilter = () => {
    setMiaFilteredEventIds(null);
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

  // Render User Matcher
  if (view === ViewState.MATCHER) {
    return <TribeUserMatcher currentUserProfile={userProfile} onBack={() => setView(ViewState.PROFILE)} />;
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

            {/* USER AVATAR with Profile Hint */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileHint(false);
                  localStorage.setItem("tribe_seen_profile_hint", "true");
                  setView(userProfile ? ViewState.PROFILE : ViewState.AUTH);
                }}
                className={`flex items-center gap-2 ${
                  !isProfileComplete(userProfile) ? "animate-pulse" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-colors ${
                  !isProfileComplete(userProfile) ? "border-gold" : "border-white/20 hover:border-gold"
                }`}>
                  {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <User size={20} className="text-zinc-600" />
                    </div>
                  )}
                </div>
                {/* Show "Profil erstellen" text when profile is incomplete */}
                {!isProfileComplete(userProfile) && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gold hidden sm:block">
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

      {/* --- LIVE TICKER --- */}
      {view === ViewState.FEED && (
        <div className="fixed top-[73px] left-0 right-0 z-40 max-w-2xl mx-auto">
          <TribeLiveTicker
            events={tickerTopEvents.map((e) => ({
              id: e.id,
              date: e.date,
              title: e.title,
              location: e.location,
              likes: e.likes || 0,
            }))}
            selectedCity={selectedCity}
            onEventClick={handleTickerEventClick}
          />
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main
        className={`${view === ViewState.COMMUNITY ? "pt-16" : "pt-[110px]"} px-0 max-w-2xl mx-auto h-screen overflow-y-auto`}
      >
        {view === ViewState.FEED && (
          <div className="animate-fadeIn pb-20">
            {/* MIA Inline Chat - Full AI Integration with Onboarding */}
            <div className="px-6 pt-2 pb-4 bg-gradient-to-b from-black via-black to-transparent">
              <MiaInlineChat
                events={allEvents}
                userProfile={userProfile ? {
                  username: userProfile.username,
                  interests: userProfile.interests,
                  favorite_locations: userProfile.favorite_locations,
                  hobbies: userProfile.hobbies,
                } : undefined}
                city={selectedCity}
                onQuery={handleQuery}
                onEventsFiltered={handleMiaEventsFiltered}
                onClearFilter={handleMiaClearFilter}
                onboardingStep={isOnboarding ? currentStep : undefined}
                onAdvanceOnboarding={advanceStep}
              />

              {/* Category Tabs */}
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-3 mt-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs font-medium uppercase tracking-wider whitespace-nowrap transition-colors ${
                      selectedCategory === cat ? "text-gold" : "text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Active MIA Filter Indicator */}
              {miaFilteredEventIds && (
                <div className="mt-3 flex justify-between items-center bg-gold/10 border border-gold/30 px-3 py-2 rounded-sm animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <Filter size={12} className="text-gold" />
                    <span className="text-[10px] text-gold font-bold uppercase tracking-widest">
                      MIA zeigt {miaFilteredEventIds.length} Events
                    </span>
                  </div>
                  <button
                    onClick={handleMiaClearFilter}
                    className="text-[9px] text-zinc-400 hover:text-white underline"
                  >
                    ALLE ANZEIGEN
                  </button>
                </div>
              )}
            </div>

            {/* MIA Recommendations */}
            {spotlightEvents.length > 0 && (
              <div className="mb-4">
                <div className="px-6 mb-5">
                  <h2 className="text-xs font-extrabold text-white uppercase tracking-[0.25em] flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full overflow-hidden">
                      <img src={MIA_AVATAR} className="w-full h-full object-cover" alt="MIA" />
                    </div>
                    MIA Recommendations
                  </h2>
                </div>
                <div 
                  className="flex gap-4 overflow-x-auto no-scrollbar snap-x px-6 pb-4"
                  onScroll={handleHeroScroll}
                >
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
                  {/* Loading indicator when more available */}
                  {heroLoadedCount < filteredEvents.length && (
                    <div className="min-w-[60px] flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Feed List */}
            <div className="px-6 space-y-2 pb-12">
              <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
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
                            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
                              .toISOString()
                              .split("T")[0];
                            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
                              .toISOString()
                              .split("T")[0];

                            // Check if we have events for this date range
                            const hasEventsInRange = allEvents.some((e) => e.date >= monthStart && e.date <= monthEnd);

                            if (!hasEventsInRange) {
                              console.log("🔄 [TribeApp] Loading events for selected month");
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
                </div>
              </div>
              {/* Like Tutorial for first-time Feed visitors - hide during onboarding */}
              {showLikeTutorial && view === ViewState.FEED && !isOnboarding && (
                <div className="mb-4 bg-zinc-900/80 border border-gold/30 rounded-lg p-3 animate-fadeIn">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-gold uppercase tracking-widest">💡 Tipp</span>
                    <button
                      onClick={() => {
                        setShowLikeTutorial(false);
                        localStorage.setItem("tribe_seen_like_tutorial", "true");
                      }}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                    <strong className="text-white">Like Events</strong> die dich interessieren! Je mehr du likest, desto
                    besser lernt MIA deinen Geschmack kennen und zeigt dir passende Events zuerst.
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    <strong className="text-gold">✨ Vibe</strong> – Tippe auf das Sparkles-Icon um eine KI-Zusammenfassung
                    des Events zu erhalten. Das Bild wird dabei vergrößert angezeigt.
                  </p>
                </div>
              )}

              {feedEvents.length > 0 ? (
                (() => {
                  // Always compact mode - group events by date
                  const grouped: Record<string, TribeEvent[]> = {};
                    feedEvents.forEach((event) => {
                      if (!grouped[event.date]) grouped[event.date] = [];
                      grouped[event.date].push(event);
                    });

                    const sortedDates = Object.keys(grouped).sort();
                    const MAX_COLLAPSED_EVENTS = 5;
                    const now = new Date();
                    const currentHour = now.getHours();
                    const todayStr = now.toISOString().split("T")[0];

                    return sortedDates.map((date) => {
                      const dateObj = new Date(date);
                      const weekday = dateObj.toLocaleDateString("de-DE", { weekday: "long" });
                      const day = dateObj.getDate();
                      const month = dateObj.toLocaleDateString("de-DE", { month: "long" });
                      const isToday = date === todayStr;

                      // Sort events: active events first, past events last (only for today)
                      const allEventsForDate = [...grouped[date]].sort((a, b) => {
                        if (!isToday) return 0;
                        
                        const getEventHour = (timeStr?: string | null) => {
                          if (!timeStr) return 23;
                          const match = timeStr.match(/^(\d{1,2})/);
                          return match ? parseInt(match[1], 10) : 23;
                        };
                        
                        const aHour = getEventHour(a.time);
                        const bHour = getEventHour(b.time);
                        const aIsPast = aHour < currentHour;
                        const bIsPast = bHour < currentHour;
                        
                        // Past events go to the end
                        if (aIsPast && !bIsPast) return 1;
                        if (!aIsPast && bIsPast) return -1;
                        return 0;
                      });
                      
                      // Separate active and past events for today
                      const activeEvents = isToday 
                        ? allEventsForDate.filter(e => {
                            const match = e.time?.match(/^(\d{1,2})/);
                            const hour = match ? parseInt(match[1], 10) : 23;
                            return hour >= currentHour;
                          })
                        : allEventsForDate;
                      
                      const pastEvents = isToday 
                        ? allEventsForDate.filter(e => {
                            const match = e.time?.match(/^(\d{1,2})/);
                            const hour = match ? parseInt(match[1], 10) : 23;
                            return hour < currentHour;
                          })
                        : [];

                      const isExpanded = expandedDates.has(date);
                      const shouldCollapse = (hasLikedFirstEvent && activeEvents.length > MAX_COLLAPSED_EVENTS) || pastEvents.length > 0;
                      const displayedEvents =
                        shouldCollapse && !isExpanded
                          ? activeEvents.slice(0, MAX_COLLAPSED_EVENTS)
                          : [...activeEvents, ...pastEvents];
                      const hiddenActiveCount = Math.max(0, activeEvents.length - MAX_COLLAPSED_EVENTS);
                      const hiddenCount = (hasLikedFirstEvent ? hiddenActiveCount : 0) + pastEvents.length;

                      return (
                        <div key={date} className="mb-6">
                          <h3 className="text-sm font-serif text-white/90 mb-2 capitalize">
                            {weekday}, {day}. {month}
                          </h3>
                          <div className="space-y-0">
                            {displayedEvents.map((event) => {
                              // Check if this event is past (today only)
                              const isPastEvent = isToday && (() => {
                                const match = event.time?.match(/^(\d{1,2})/);
                                const hour = match ? parseInt(match[1], 10) : 23;
                                return hour < currentHour;
                              })();
                              
                              return (
                                <div 
                                  key={event.id} 
                                  className={`animate-fade-in transition-all duration-300 ease-out ${isPastEvent ? 'opacity-40' : ''}`}
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
                                    isPast={isPastEvent}
                                  />
                                </div>
                              );
                            })}
                          </div>

                          {/* Expand button for collapsed dates */}
                          {shouldCollapse && !isExpanded && hiddenCount > 0 && (
                            <button
                              onClick={() => setExpandedDates((prev) => new Set([...prev, date]))}
                              className="w-full mt-2 py-2 text-[10px] text-zinc-500 hover:text-gold uppercase tracking-widest border border-dashed border-white/10 hover:border-gold/30 transition-colors flex items-center justify-center gap-2"
                            >
                              <ChevronDown size={12} />
                              +{hiddenCount} weitere Events 
                              {pastEvents.length > 0 && isToday && ` (${pastEvents.length} bereits vorbei)`}
                            </button>
                          )}

                          {/* Collapse button when expanded */}
                          {shouldCollapse && isExpanded && (
                            <button
                              onClick={() =>
                                setExpandedDates((prev) => {
                                  const newSet = new Set(prev);
                                  newSet.delete(date);
                                  return newSet;
                                })
                              }
                              className="w-full mt-2 py-2 text-[10px] text-zinc-500 hover:text-gold uppercase tracking-widest border border-dashed border-white/10 hover:border-gold/30 transition-colors flex items-center justify-center gap-2"
                            >
                              <ChevronDown size={12} className="rotate-180" />
                              Weniger anzeigen
                            </button>
                          )}
                        </div>
                      );
                    });
                })()
              ) : (
                <div className="py-10 text-center text-zinc-600 font-light text-sm">No events in this sector.</div>
              )}

              {/* Infinite Scroll Trigger */}
              {!selectedDate && feedEvents.length > 0 && (
                <div
                  ref={(el) => {
                    if (!el) return;
                    const observer = new IntersectionObserver(
                      (entries) => {
                        if (entries[0].isIntersecting && !isLoadingMore && hasMoreEvents) {
                          console.log("🔄 [TribeApp] Infinite scroll triggered, loadedEventCount:", loadedEventCount);
                          loadMoreEvents();
                        }
                      },
                      { threshold: 0.1 },
                    );
                    observer.observe(el);
                  }}
                  className="h-20 flex items-center justify-center"
                >
                  {isLoadingMore ? (
                    <div className="text-zinc-600 text-xs">Lädt weitere Events...</div>
                  ) : hasMoreEvents ? (
                    <div className="text-zinc-700 text-[10px]">Scroll für mehr Events</div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MIA is now integrated directly into the Explore page - no separate view needed */}
        {view === ViewState.COMMUNITY && (
          <TribeCommunityBoard
            selectedCity={selectedCity}
            userProfile={userProfile}
            onEditProfile={() => setView(ViewState.PROFILE)}
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
    </div>
  );
};
