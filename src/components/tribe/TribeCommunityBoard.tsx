import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { UserProfile, Post, Comment } from '@/types/tribe';
import { ArrowRight, MessageCircle, Hash, Send, X, Check, HelpCircle, Users, Camera, Star, Sparkles, Edit3, Image, Loader2, Heart, Download, Smartphone, Bell } from 'lucide-react';
import { CommunityPost } from './CommunityPost';
import { SpontanCard } from './SpontanCard';
import { supabase } from '@/integrations/supabase/client';
import { chatMediaService } from '@/services/chatMediaService';
import { initializeFCM } from '@/services/firebaseMessaging';
import { useToast } from '@/hooks/use-toast';
import { useEventContext } from '@/contexts/EventContext';
import { SpontanButton } from './SpontanButton';
import { LiveActivityTicker } from './LiveActivityTicker';
import { Badge } from '@/components/ui/badge';
import { OnboardingStep } from '@/hooks/useOnboardingFlow';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

interface Props {
  selectedCity: string;
  userProfile: UserProfile;
  onProfileClick?: (username: string) => void;
  onEditProfile?: () => void;
  onEventClick?: (eventId: string) => void;
  // Onboarding props
  onboardingStep?: OnboardingStep;
  onAdvanceOnboarding?: () => void;
  onMarkProfileComplete?: () => void;
  onMarkGreetingPosted?: () => void;
  generateGreeting?: (profile: { username?: string; interests?: string[]; favorite_locations?: string[] }) => string;
}

// Sort users: real uploaded avatar first, then current user
const hasRealAvatar = (avatar?: string | null) =>
  !!avatar && !avatar.includes('unsplash.com');

const sortByRealAvatar = <T extends { avatar?: string | null; username?: string }>(
  list: T[],
  currentUsername?: string
): T[] => {
  return [...list].sort((a, b) => {
    // Current user always first
    if (currentUsername) {
      if (a.username === currentUsername) return -1;
      if (b.username === currentUsername) return 1;
    }
    const aReal = hasRealAvatar(a.avatar);
    const bReal = hasRealAvatar(b.avatar);
    if (aReal && !bReal) return -1;
    if (!aReal && bReal) return 1;
    return 0;
  });
};



const TRIBE_BOARD_GROUP_ID = 'tribe_community_board';

// LocalStorage keys for dismissed posts and topic preferences
const DISMISSED_POSTS_KEY = 'tribe_dismissed_posts';
const TOPIC_DISLIKES_KEY = 'tribe_topic_dislikes';
const WELCOME_MESSAGE_DISMISSED_KEY = 'tribe_welcome_message_dismissed';

const getCommunityIntroMessage = (username?: string) => ({
  text: `Hey ${username || 'du'}! 👋 Schön, dass du da bist! THE TRIBE ist dein Ort für echte Begegnungen – ob spontane Treffen, coole Events oder einfach neue Leute kennenlernen. Stell dich unten kurz vor und erzähl uns einen Fun Fact über dich! 🎲`,
  showNext: false,
});

const COMMUNITY_ONBOARDING_MESSAGES: Record<string, { text: string; showNext?: boolean; showAction?: 'avatar' | 'post'; showGuidanceChoice?: boolean }> = {
  explain_profile: {
    text: 'Damit andere dich finden können, brauchen wir ein bisschen mehr über dich. Dein Profil zeigt, wer du bist und was dich begeistert – so finden dich Menschen mit ähnlichen Interessen! ✨',
    showNext: true,
  },
  waiting_for_avatar_click: {
    text: 'Klicke oben rechts auf deinen Avatar 👆 um dein Profil zu bearbeiten!',
    showAction: 'avatar',
  },
  editing_profile: {
    text: 'Super! Füge ein Bild hinzu und erzähl uns von deinen Interessen – das macht es anderen leichter, dich anzusprechen! 💫',
  },
  greeting_ready: {
    text: 'Perfekt! 🙌 Deine Vorstellung ist fast fertig – ergänze noch einen Fun Fact über dich (z.B. dein guilty pleasure, ein Talent oder was Lustiges) und klick auf Post!',
    showAction: 'post',
  },
  waiting_for_post: {
    text: 'Klick auf "Post" um dich vorzustellen! 👇',
    showAction: 'post',
  },
  offer_guidance: {
    text: 'Willkommen in der Tribe! 🎊 Ab jetzt kannst du Events entdecken, Leute treffen und echte Verbindungen aufbauen.',
    showGuidanceChoice: true,
  },
};

export const TribeCommunityBoard: React.FC<Props> = ({ 
  selectedCity, 
  userProfile, 
  onProfileClick, 
  onEditProfile,
  onEventClick,
  onboardingStep,
  onAdvanceOnboarding,
  onMarkProfileComplete,
  onMarkGreetingPosted,
  generateGreeting,
}) => {
  const { toast } = useToast();
  const { selectedCity: eventCity } = useEventContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [visibleCount, setVisibleCount] = useState(15);
  const [newPost, setNewPost] = useState('');
  
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [dismissedPosts, setDismissedPosts] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(DISMISSED_POSTS_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [topicDislikes, setTopicDislikes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(TOPIC_DISLIKES_KEY);
    return saved ? JSON.parse(saved) : {};
  });
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(() => 
    localStorage.getItem('tribe_profile_banner_dismissed') === 'true'
  );
  const [welcomeMessageDismissed, setWelcomeMessageDismissed] = useState(() => 
    localStorage.getItem(WELCOME_MESSAGE_DISMISSED_KEY) === 'true'
  );
  const [onboardingMiaMessage, setOnboardingMiaMessage] = useState<string | null>(null);
  const [greetingGenerated, setGreetingGenerated] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // "I'm in" state for top event cards: eventId -> list of usernames
  const [imInUsers, setImInUsers] = useState<Record<string, string[]>>({});
  // Avatar cache: username -> avatar URL
  const [avatarCache, setAvatarCache] = useState<Record<string, string | null>>({});

  // Load persisted "I'm in" data from community_events on mount
  useEffect(() => {
    const loadImInData = async () => {
      try {
        const { data } = await supabase
          .from('community_events')
          .select('id, liked_by_users')
          .not('liked_by_users', 'eq', '[]');
        
        if (data) {
          const mapped: Record<string, string[]> = {};
          data.forEach((evt: any) => {
            const users = evt.liked_by_users;
            if (Array.isArray(users) && users.length > 0) {
              mapped[evt.id] = users.filter((u: any) => typeof u === 'string');
            }
          });
          setImInUsers(mapped);
        }
      } catch (err) {
        console.error('Error loading I\'m in data:', err);
      }
    };
    loadImInData();
  }, []);

  // Handle community onboarding
  useEffect(() => {
    if (!onboardingStep) return;
    
    const isCommunityStep = ['community_intro', 'explain_profile', 'waiting_for_avatar_click', 'editing_profile', 'greeting_ready', 'waiting_for_post', 'offer_guidance'].includes(onboardingStep);
    
    if (isCommunityStep) {
      // For community_intro, only show if not already dismissed
      if (onboardingStep === 'community_intro') {
        if (!welcomeMessageDismissed) {
          setOnboardingMiaMessage(getCommunityIntroMessage(userProfile.username).text);
        }
      } else {
        const message = COMMUNITY_ONBOARDING_MESSAGES[onboardingStep];
        if (message?.text) {
          setOnboardingMiaMessage(message.text);
        }
      }
      
      // Generate greeting immediately when community_intro starts (new users)
      // This pre-fills the post area so users see it right away
      if ((onboardingStep === 'community_intro' || onboardingStep === 'greeting_ready') && generateGreeting && !greetingGenerated) {
        const greeting = generateGreeting({
          username: userProfile.username,
          interests: userProfile.interests,
          favorite_locations: userProfile.favorite_locations,
        });
        setNewPost(greeting);
        setGreetingGenerated(true);
        // Focus and expand the textarea
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            // Auto-resize to fit content
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
          }
        }, 100);
      }
    } else {
      setOnboardingMiaMessage(null);
    }
  }, [onboardingStep, generateGreeting, greetingGenerated, userProfile, onAdvanceOnboarding, welcomeMessageDismissed]);

  // Load posts from database
  useEffect(() => {
    loadPosts();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('tribe_board_posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${TRIBE_BOARD_GROUP_ID}`
      }, (payload) => {
        const newMessage = payload.new;
        if (newMessage.parent_id) {
          // It's a comment, refresh posts to update comments
          loadPosts();
        } else {
          // It's a new post
          const post = convertMessageToPost(newMessage);
          setPosts(prev => [post, ...prev]);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${TRIBE_BOARD_GROUP_ID}`
      }, (payload) => {
        // Optimized: patch the single post in state instead of full reload
        const updated = payload.new;
        setPosts(prev => prev.map(p => {
          if (p.id !== updated.id) return p;
          return {
            ...p,
            ...convertMessageToPost(updated),
            comments: p.comments, // keep existing comments
          };
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadPosts = async () => {
    try {
      // Fetch all posts (parent messages)
      const { data: postsData, error: postsError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('group_id', TRIBE_BOARD_GROUP_ID)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch all comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('group_id', TRIBE_BOARD_GROUP_ID)
        .not('parent_id', 'is', null)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Convert to Post objects
      const convertedPosts = (postsData || []).map(msg => {
        const postComments = (commentsData || [])
          .filter(c => c.parent_id === msg.id)
          .map(c => convertMessageToComment(c));
        
        return {
          ...convertMessageToPost(msg),
          comments: postComments
        };
      });

      setPosts(convertedPosts);

      // Collect all unique usernames from poll votes that need avatar lookup
      const usernamesNeeded = new Set<string>();
      (postsData || []).forEach(msg => {
        if (msg.poll_votes) {
          Object.values(msg.poll_votes as Record<string, any[]>).forEach(voters => {
            (voters || []).forEach((v: any) => {
              const name = typeof v === 'string' ? v : v?.username;
              if (name) usernamesNeeded.add(name);
            });
          });
        }
      });

      if (usernamesNeeded.size > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('username, avatar')
          .in('username', [...usernamesNeeded]);
        
        if (profiles) {
          const cache: Record<string, string | null> = {};
          profiles.forEach((p: any) => { cache[p.username] = p.avatar || null; });
          setAvatarCache(prev => ({ ...prev, ...cache }));
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-detect topic from post text
  const detectTopics = (text: string): string[] => {
    const detected: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Topic patterns
    const topicPatterns: { keywords: string[]; tag: string }[] = [
      { keywords: ['sport', 'fitness', 'laufen', 'joggen', 'gym', 'training', 'fußball', 'basketball'], tag: 'Sport' },
      { keywords: ['party', 'feiern', 'club', 'tanzen', 'disko', 'disco'], tag: 'Party' },
      { keywords: ['kunst', 'ausstellung', 'galerie', 'museum', 'kreativ'], tag: 'Kunst' },
      { keywords: ['musik', 'konzert', 'live', 'band', 'gig'], tag: 'Musik' },
      { keywords: ['essen', 'restaurant', 'food', 'café', 'brunch', 'dinner'], tag: 'Food' },
      { keywords: ['weihnacht', 'advent', 'glühwein'], tag: 'Weihnachten' },
      { keywords: ['tipp', 'empfehl', 'insider', 'geheimtipp'], tag: 'InsiderTipp' },
      { keywords: ['kino', 'film', 'movie'], tag: 'Kino' },
      { keywords: ['wandern', 'natur', 'park', 'spazier'], tag: 'Outdoor' },
      { keywords: ['networking', 'business', 'startup', 'gründer'], tag: 'Business' },
    ];
    
    // Check for TribeCall patterns (people looking for others)
    if (lowerText.includes('wer hat lust') || lowerText.includes('suche') || 
        lowerText.includes('jemand dabei') || lowerText.includes('wer kommt') ||
        lowerText.includes('tribecall') || lowerText.includes('tribe call')) {
      detected.push('TribeCall');
    }
    
    // Check other topics
    for (const pattern of topicPatterns) {
      if (pattern.keywords.some(kw => lowerText.includes(kw))) {
        detected.push(pattern.tag);
      }
    }
    
    return detected;
  };

  const convertMessageToPost = (msg: any): Post => {
    const reactions = msg.reactions as { emoji: string; users: string[] }[] || [];
    const heartReaction = reactions.find(r => r.emoji === '❤️');
    const likes = heartReaction?.users?.length || 0;
    const likedBy = heartReaction?.users || [];
    
    // Extract explicit hashtags from text
    const explicitTags: string[] = [];
    const hashtagRegex = /#(\w+)/g;
    let match;
    while ((match = hashtagRegex.exec(msg.text)) !== null) {
      explicitTags.push(match[1]);
    }
    
    // Auto-detect topics
    const detectedTags = detectTopics(msg.text);
    
    // Combine and deduplicate
    const allTags = [...new Set([...detectedTags, ...explicitTags])];

    return {
      id: msg.id,
      user: msg.sender,
      text: msg.text,
      city: selectedCity,
      likes,
      likedBy,
      time: formatTime(msg.created_at),
      timestamp: msg.created_at,
      tags: allTags,
      userAvatar: msg.avatar,
      comments: [],
      meetup_responses: msg.meetup_responses || {},
      mediaUrl: msg.media_url || null,
      poll_question: msg.poll_question || null,
      poll_options: msg.poll_options ? (msg.poll_options as string[]) : null,
      poll_votes: msg.poll_votes ? (msg.poll_votes as Record<string, string[]>) : null,
      poll_allow_multiple: msg.poll_allow_multiple || false,
    };
  };

  const convertMessageToComment = (msg: any): Comment => {
    return {
      id: msg.id,
      user: msg.sender,
      text: msg.text,
      time: formatTime(msg.created_at),
      timestamp: msg.created_at, // Store raw timestamp for sorting
      userAvatar: msg.avatar
    };
  };

  const formatTime = (timestamp: string): string => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now.getTime() - messageTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Helper to get last activity timestamp for a post
  const getLastActivityTime = (post: Post): number => {
    const postTime = new Date(post.timestamp).getTime();
    if (post.comments && post.comments.length > 0) {
      // Find newest comment timestamp
      const newestCommentTime = Math.max(
        ...post.comments.map(c => new Date(c.timestamp).getTime())
      );
      return Math.max(postTime, newestCommentTime);
    }
    return postTime;
  };

  // Check if user is involved in a post (authored or commented)
  const isOwnPost = (post: Post): boolean => userProfile?.username ? post.user === userProfile.username : false;
  const isInvolvedInPost = (post: Post): boolean => {
    if (!userProfile?.username) return false;
    if (isOwnPost(post)) return false; // Own posts handled separately
    return post.comments?.some(c => c.user === userProfile.username) || false;
  };

  // Calculate relevance score based on user interests and topic preferences
  const calculateRelevanceScore = (post: Post): number => {
    let score = 50; // Base score
    
    const userInterests = userProfile?.interests || [];
    const userLocations = userProfile?.favorite_locations || [];
    
    // Boost for matching interests
    post.tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      if (userInterests.some(i => i.toLowerCase().includes(tagLower) || tagLower.includes(i.toLowerCase()))) {
        score += 15;
      }
    });
    
    // Boost for matching locations in text
    userLocations.forEach(loc => {
      if (post.text.toLowerCase().includes(loc.toLowerCase())) {
        score += 10;
      }
    });
    
    // Penalize for dismissed topic patterns
    post.tags.forEach(tag => {
      const dislikeCount = topicDislikes[tag.toLowerCase()] || 0;
      score -= dislikeCount * 5;
    });
    
    // Boost for TribeCalls (community engagement)
    if (post.tags.includes('TribeCall')) score += 10;
    
    // Boost for popular posts
    if (post.likes > 5) score += 5;
    if (post.comments && post.comments.length > 3) score += 5;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  // Handle dismissing a post
  const handleDismissPost = (postId: string, postTags: string[]) => {
    // Update dismissed posts
    const newDismissed = new Set(dismissedPosts);
    newDismissed.add(postId);
    setDismissedPosts(newDismissed);
    localStorage.setItem(DISMISSED_POSTS_KEY, JSON.stringify([...newDismissed]));
    
    // Track topic dislikes
    const newTopicDislikes = { ...topicDislikes };
    postTags.forEach(tag => {
      const key = tag.toLowerCase();
      newTopicDislikes[key] = (newTopicDislikes[key] || 0) + 1;
    });
    setTopicDislikes(newTopicDislikes);
    localStorage.setItem(TOPIC_DISLIKES_KEY, JSON.stringify(newTopicDislikes));
  };

  // Handle Location Poll vote
  const handlePollVote = async (postId: string, optionIndex: number, currentVotes: Record<string, any[]> | null, allowMultiple: boolean) => {
    try {
      const username = userProfile?.username || 'Guest';
      const avatar = userProfile?.avatarUrl || userProfile?.avatar || null;
      const votes = { ...(currentVotes || {}) };
      const key = String(optionIndex);

      if (!allowMultiple) {
        // Remove user from all options first (support both old string[] and new {username,avatar}[] format)
        Object.keys(votes).forEach(k => {
          votes[k] = (votes[k] || []).filter((u: any) => (typeof u === 'string' ? u : u.username) !== username);
        });
      }

      const alreadyVoted = (votes[key] || []).some((u: any) => (typeof u === 'string' ? u : u.username) === username);
      if (!alreadyVoted) {
        votes[key] = [...(votes[key] || []), { username, avatar }];
      } else {
        votes[key] = (votes[key] || []).filter((u: any) => (typeof u === 'string' ? u : u.username) !== username);
      }

      await supabase.from('chat_messages').update({ poll_votes: votes }).eq('id', postId);
      loadPosts();
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  };

  // Handle RSVP for TribeCalls
  const handleRSVP = async (postId: string, response: 'yes' | 'no' | 'maybe') => {
    try {
      const { data: msg, error: fetchError } = await supabase
        .from('chat_messages')
        .select('meetup_responses')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      const responses = (msg.meetup_responses as Record<string, Array<{username: string; avatar?: string}>>) || {};
      const responseKey = response === 'yes' ? 'bin dabei' : response === 'no' ? 'diesmal nicht' : 'vielleicht';
      
      // Remove user from all response arrays first
      ['bin dabei', 'diesmal nicht', 'vielleicht'].forEach(key => {
        if (responses[key]) {
          responses[key] = responses[key].filter(u => u.username !== userProfile?.username);
        }
      });
      
      // Add to selected response
      if (!responses[responseKey]) responses[responseKey] = [];
      responses[responseKey].push({ 
        username: userProfile?.username || 'Guest', 
        avatar: userProfile?.avatarUrl || userProfile?.avatar 
      });

      await supabase
        .from('chat_messages')
        .update({ meetup_responses: responses })
        .eq('id', postId);

      loadPosts(); // Refresh to show updated responses
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  };

  // Get user's current RSVP status for a post
  const getUserRSVP = (post: Post): string | null => {
    const responses = post.meetup_responses;
    if (!responses) return null;
    
    for (const [key, users] of Object.entries(responses)) {
      if (users?.some(u => u.username === userProfile?.username)) {
        return key;
      }
    }
    return null;
  };

  // Handle "I'm in" for top event cards
  const handleImIn = async (eventId: string) => {
    const username = userProfile?.username;
    if (!username) return;
    
    setImInUsers(prev => {
      const current = prev[eventId] || [];
      if (current.includes(username)) {
        return { ...prev, [eventId]: current.filter(u => u !== username) };
      }
      return { ...prev, [eventId]: [...current, username] };
    });

    // Also persist as a like on the community_events table
    try {
      const { data: event } = await supabase
        .from('community_events')
        .select('liked_by_users')
        .eq('id', eventId)
        .single();
      
      if (event) {
        const likedBy = (event.liked_by_users as string[]) || [];
        const alreadyLiked = likedBy.includes(username);
        const updatedLikes = alreadyLiked 
          ? likedBy.filter((u: string) => u !== username)
          : [...likedBy, username];
        
        await supabase
          .from('community_events')
          .update({ liked_by_users: updatedLikes, likes: updatedLikes.length })
          .eq('id', eventId);
      }
    } catch (err) {
      console.error('Error toggling I\'m in:', err);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts
      .filter(p => {
        // Filter out dismissed posts
        if (dismissedPosts.has(p.id)) return false;
        if (selectedCity !== 'All' && p.city !== selectedCity) return false;
        return true;
      })
      .map(p => ({ ...p, relevanceScore: calculateRelevanceScore(p) }))
      .sort((a, b) => {
        // Sort by last activity (post creation or newest comment)
        const aTime = getLastActivityTime(a);
        const bTime = getLastActivityTime(b);
        return bTime - aTime;
      });
  }, [posts, dismissedPosts, selectedCity, topicDislikes, userProfile]);


  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Bitte nur Bilder hochladen');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Bild darf maximal 5MB groß sein');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleEnablePushNotifications = async () => {
    try {
      const token = await initializeFCM(eventCity, true);
      if (token) {
        toast({ title: "Erfolgreich!", description: "Push-Benachrichtigungen wurden aktiviert." });
      } else {
        toast({ title: "Fehler", description: "Push-Benachrichtigungen konnten nicht aktiviert werden.", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      toast({ title: "Fehler", description: "Push-Benachrichtigungen konnten nicht aktiviert werden.", variant: "destructive" });
    }
  };

  const handlePost = async () => {
    if (!newPost.trim() && !selectedImage) return;
    
    setIsUploading(true);
    
    try {
      // Upload image if selected
      let mediaUrl: string | null = null;
      if (selectedImage) {
        mediaUrl = await chatMediaService.uploadChatImage(selectedImage);
      }
      
      // Auto-tag 'TribeCall' if text implies it (simple check for demo)
      const tags = [...generatedTags];
      if (newPost.toLowerCase().includes('suche') || newPost.toLowerCase().includes('tribe') || newPost.toLowerCase().includes('wer')) {
          if (!tags.includes('TribeCall')) tags.push('TribeCall');
      }

      // Add hashtags to text
      let postText = newPost.trim() || (mediaUrl ? '📷 Bild' : '');
      if (tags.length > 0) {
        postText += '\n\n' + tags.map(t => `#${t}`).join(' ');
      }

      await supabase
        .from('chat_messages')
        .insert({
          group_id: TRIBE_BOARD_GROUP_ID,
          sender: userProfile?.username || 'Guest',
          text: postText,
          avatar: userProfile?.avatarUrl || userProfile?.avatar || null,
          media_url: mediaUrl
        });

      setNewPost('');
      setGeneratedTags([]);
      clearSelectedImage();
      
      // If during onboarding greeting step, mark it complete
      if (onboardingStep === 'community_intro' || onboardingStep === 'greeting_ready' || onboardingStep === 'waiting_for_post') {
        onMarkGreetingPosted?.();
      }
    } catch (error) {
      console.error('Error posting:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReply = async (postId: string) => {
    if (!replyText.trim()) return;

    try {
      await supabase
        .from('chat_messages')
        .insert({
          group_id: TRIBE_BOARD_GROUP_ID,
          sender: userProfile.username,
          text: replyText,
          avatar: userProfile.avatarUrl || userProfile.avatar || null,
          parent_id: postId
        });

      setReplyText('');
    } catch (error) {
      console.error('Error replying:', error);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      // Get current message
      const { data: msg, error: fetchError } = await supabase
        .from('chat_messages')
        .select('reactions')
        .eq('id', postId)
        .single();

      if (fetchError) throw fetchError;

      const reactions = (msg.reactions as { emoji: string; users: string[] }[] || []);
      const heartReaction = reactions.find(r => r.emoji === '❤️');
      
      let newReactions;
      if (heartReaction) {
        // Check if user already liked
        if (heartReaction.users.includes(userProfile.username)) {
          // Unlike
          heartReaction.users = heartReaction.users.filter(u => u !== userProfile.username);
        } else {
          // Like
          heartReaction.users.push(userProfile.username);
        }
        newReactions = reactions;
      } else {
        // Add new heart reaction
        newReactions = [...reactions, { emoji: '❤️', users: [userProfile.username] }];
      }

      // Update in database
      await supabase
        .from('chat_messages')
        .update({ reactions: newReactions })
        .eq('id', postId);

    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

    return (
    <div className="h-full flex flex-col bg-black animate-fadeIn overflow-x-hidden">
        
        {/* --- INPUT AREA --- */}
        <div className="px-4 py-1.5 border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur-xl z-20 space-y-2">
            {/* WhatsApp Community Chat Banner */}
            <a
              href="https://chat.whatsapp.com/CTbK6Xi8QHRExmoXhkaqvL"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-lg px-3 py-2 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">Community Chat</div>
                <div className="text-xs text-white/60 truncate">Tritt unserer WhatsApp-Gruppe bei</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#25D366] shrink-0" />
            </a>

            {/* Spontan Button - above chat input */}
            <SpontanButton userProfile={userProfile} selectedCity={selectedCity} />
            
            <div className={`bg-zinc-900/60 border rounded-lg p-1.5 flex items-end gap-1 ${
              (onboardingStep === 'community_intro' || onboardingStep === 'greeting_ready' || onboardingStep === 'waiting_for_post') 
                ? 'border-gold/50 ring-2 ring-gold/20' 
                : 'border-zinc-700/60'
            }`}>
                <textarea 
                    ref={textareaRef}
                    value={newPost}
                    onChange={(e) => {
                        setNewPost(e.target.value);
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                    placeholder={
                      (onboardingStep === 'community_intro' || onboardingStep === 'greeting_ready' || onboardingStep === 'waiting_for_post')
                        ? '👋 Stell dich vor...'
                        : `What's happening in ${selectedCity}?`
                    }
                    className="flex-1 bg-transparent text-white text-sm placeholder-zinc-500 outline-none resize-none min-h-[28px] max-h-[120px] py-1"
                    rows={1}
                />
                
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Hidden file input */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    
                    {/* Image upload button */}
                    <button 
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-1.5 text-zinc-500 hover:text-gold transition-colors disabled:opacity-50"
                        title="Bild hinzufügen"
                    >
                        <Image size={18} />
                    </button>
                    
                    {/* Push notification bell button */}
                    <button 
                        onClick={handleEnablePushNotifications}
                        className="p-1.5 text-zinc-500 hover:text-gold transition-colors"
                        title="Push-Benachrichtigungen aktivieren"
                    >
                        <Bell size={18} />
                    </button>
                    
                    <button 
                        onClick={handlePost} 
                        disabled={(!newPost.trim() && !selectedImage) || isUploading} 
                        className={`isolate relative z-10 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 transition-colors flex items-center gap-1 rounded ${
                          (onboardingStep === 'greeting_ready' || onboardingStep === 'waiting_for_post')
                            ? 'bg-gold text-black hover:bg-gold/90 animate-pulse'
                            : 'text-black'
                        }`}
                        style={{ backgroundColor: (onboardingStep === 'greeting_ready' || onboardingStep === 'waiting_for_post') ? undefined : '#FFFFFF' }}
                    >
                        {isUploading ? <Loader2 size={12} className="animate-spin" /> : 'Post'}
                    </button>
                </div>
            </div>
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="h-20 w-20 object-cover rounded-lg border border-white/20"
                />
                <button
                  onClick={clearSelectedImage}
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 hover:bg-red-600 transition-colors"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            )}
            
            {/* Tags Preview - only show when tags exist */}
            {generatedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                    {generatedTags.map(tag => (
                        <span key={tag} className="text-[8px] text-gold bg-gold/10 px-1 py-0.5 rounded-sm uppercase tracking-wider">#{tag}</span>
                    ))}
                </div>
            )}
        </div>

        {/* --- FEED --- */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-16">
            {/* Download Banner */}
            <DownloadBanner />
            
            {/* Live Activity Ticker */}
            <LiveActivityTicker onEventClick={onEventClick} />
            {/* MIA Willkommensnachricht - scrollbar im Feed */}
            {onboardingMiaMessage && (
              <div className="flex items-start gap-2 p-3 bg-zinc-900/50 border border-gold/20 rounded-lg animate-fadeIn relative">
                <button
                  onClick={() => {
                    // Permanently dismiss the welcome message
                    localStorage.setItem(WELCOME_MESSAGE_DISMISSED_KEY, 'true');
                    setWelcomeMessageDismissed(true);
                    setOnboardingMiaMessage(null);
                  }}
                  className="absolute top-2 right-2 p-1 text-white/40 hover:text-white/80 transition-colors"
                  aria-label="Schließen"
                >
                  <X size={14} />
                </button>
                <img 
                  loading="lazy"
                  src={MIA_AVATAR} 
                  className="w-10 h-10 rounded-full ring-2 ring-gold/50 object-cover flex-shrink-0" 
                  alt="MIA" 
                />
                <div className="flex-1 min-w-0 pr-6">
                  <span className="text-xs font-bold text-gold">MIA</span>
                  <p className="text-sm text-white/90 leading-relaxed mt-1">
                    {onboardingMiaMessage}
                  </p>
                </div>
              </div>
            )}
            
            {/* Profile Creation Banner - simple, closable - HIDE during onboarding */}
            {userProfile && !profileBannerDismissed && !onboardingStep && (() => {
              const hasAvatar = !!userProfile.avatarUrl || !!userProfile.avatar;
              const hasInterests = (userProfile.interests?.length || 0) > 0;
              const hasLocations = (userProfile.favorite_locations?.length || 0) > 0;
              const isNotGuest = !userProfile.username?.startsWith("Guest_");
              const isProfileComplete = hasAvatar && hasInterests && hasLocations && isNotGuest;
              
              if (isProfileComplete) return null;
              
              return (
                <div className="bg-zinc-900/80 border border-gold/20 rounded-lg p-3 mb-3 relative">
                  <button 
                    onClick={() => {
                      localStorage.setItem('tribe_profile_banner_dismissed', 'true');
                      setProfileBannerDismissed(true);
                    }}
                    className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors p-1"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex items-center gap-3 pr-6">
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                      <Star size={14} className="text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-white">Vervollständige dein Profil</h3>
                      <p className="text-[10px] text-zinc-500">Für bessere Empfehlungen</p>
                    </div>
                    <button 
                      onClick={onEditProfile}
                      className="bg-gold hover:bg-white text-black text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors flex-shrink-0"
                    >
                      Los
                    </button>
                  </div>
                </div>
              );
            })()}
            
            {/* Welcome Widget for new members */}
            
            {loading ? (
                <div className="text-center py-10 text-zinc-600 font-light italic">
                    Loading posts...
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center py-10 text-zinc-600 font-light italic">
                    Quiet night in {selectedCity}... be the first to post.
                </div>
            ) : (
                <>
                  {filteredPosts.slice(0, visibleCount).map((post, index) => (
                    <CommunityPost
                      key={post.id}
                      post={post}
                      userProfile={userProfile}
                      isNewest={index === 0}
                      expandedPostId={expandedPostId}
                      onExpandPost={setExpandedPostId}
                      onLike={handleLike}
                      onReply={handleReply}
                      replyText={replyText}
                      onReplyTextChange={setReplyText}
                      onDismiss={handleDismissPost}
                      onRSVP={handleRSVP}
                      onPollVote={handlePollVote}
                      onProfileClick={onProfileClick}
                      imInUsers={imInUsers}
                      onImIn={handleImIn}
                      avatarCache={avatarCache}
                      getUserRSVP={getUserRSVP}
                      onEventClick={onEventClick}
                    />
                  ))}
                  {visibleCount < filteredPosts.length && (
                    <button
                      onClick={() => setVisibleCount(prev => prev + 15)}
                      className="w-full py-3 text-center text-xs font-medium text-zinc-400 hover:text-white bg-white/[0.03] border border-white/5 rounded-lg hover:bg-white/[0.06] transition-colors"
                    >
                      Mehr laden ({filteredPosts.length - visibleCount} weitere)
                    </button>
                  )}
                </>
            )}
        </div>
    </div>
  );
};

// --- Download Banner Component ---
const DOWNLOAD_BANNER_DISMISSED_KEY = 'tribe_download_banner_dismissed';

const DownloadBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(() => 
    localStorage.getItem(DOWNLOAD_BANNER_DISMISSED_KEY) === 'true'
  );
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { canInstall, isInstalled, installApp } = usePWAInstall();

  if (dismissed || isInstalled) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DOWNLOAD_BANNER_DISMISSED_KEY, 'true');
  };

  const handlePWAInstall = async () => {
    const accepted = await installApp();
    if (accepted) handleDismiss();
  };

  return (
    <div className="bg-zinc-900/80 border border-gold/20 rounded-lg p-3 relative animate-fadeIn">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 text-white/40 hover:text-white/80 transition-colors"
      >
        <X size={14} />
      </button>

      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-9 h-9 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
          <Download className="text-gold" size={18} />
        </div>
        <div>
          <h4 className="text-white font-bold text-sm tracking-wide">APP HOLEN</h4>
          <p className="text-zinc-400 text-[11px]">Push-Notifications & schnellere Experience</p>
        </div>
      </div>

      {showIOSGuide ? (
        <div className="space-y-2 mb-2">
          {[
            { step: '1', text: 'Teilen-Button tippen (unten in Safari)' },
            { step: '2', text: '"Zum Home-Bildschirm" wählen' },
            { step: '3', text: 'Fertig – THE TRIBE erscheint als App!' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-2">
              <span className="w-5 h-5 bg-gold/10 rounded-full flex items-center justify-center text-gold text-[10px] font-bold flex-shrink-0">{step}</span>
              <span className="text-zinc-300 text-xs">{text}</span>
            </div>
          ))}
          <button onClick={() => setShowIOSGuide(false)} className="text-zinc-500 text-[10px] hover:text-white transition-colors mt-1">
            ← Zurück
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* PWA Install */}
          {canInstall && (
            <button
              onClick={handlePWAInstall}
              className="flex-1 bg-gold hover:bg-gold/90 text-black font-bold text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              Installieren
            </button>
          )}

          {/* Android Play Store */}
          {!canInstall && (
            <a
              href="https://play.google.com/store/apps/details?id=co.median.android.yadezx"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors border border-white/10"
            >
              <Smartphone size={14} />
              Android
            </a>
          )}

          {/* iOS */}
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs py-2 px-3 rounded flex items-center justify-center gap-1.5 transition-colors border border-white/10"
          >
            <Smartphone size={14} />
            iOS
          </button>
        </div>
      )}
    </div>
  );
};
