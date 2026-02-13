import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile, Post, Comment } from '@/types/tribe';
import { ArrowRight, MessageCircle, Hash, Send, X, Check, HelpCircle, Users, Camera, Star, Sparkles, Edit3, Image, Loader2, Heart } from 'lucide-react';
import { SpontanCard } from './SpontanCard';
import { supabase } from '@/integrations/supabase/client';
import { chatMediaService } from '@/services/chatMediaService';
import { NewMembersWidget } from './NewMembersWidget';
import { SpontanButton } from './SpontanButton';
import { Badge } from '@/components/ui/badge';
import { OnboardingStep } from '@/hooks/useOnboardingFlow';

const MIA_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150";

interface Props {
  selectedCity: string;
  userProfile: UserProfile;
  onProfileClick?: (username: string) => void;
  onEditProfile?: () => void;
  // Onboarding props
  onboardingStep?: OnboardingStep;
  onAdvanceOnboarding?: () => void;
  onMarkProfileComplete?: () => void;
  onMarkGreetingPosted?: () => void;
  generateGreeting?: (profile: { username?: string; interests?: string[]; favorite_locations?: string[] }) => string;
}



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
  onboardingStep,
  onAdvanceOnboarding,
  onMarkProfileComplete,
  onMarkGreetingPosted,
  generateGreeting,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
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
      }, () => {
        // Refresh on updates (likes, etc.)
        loadPosts();
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
      mediaUrl: msg.media_url || null
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
            
            <div className={`bg-surface border rounded-lg p-1.5 shadow-lg flex items-end gap-2 ${
              (onboardingStep === 'community_intro' || onboardingStep === 'greeting_ready' || onboardingStep === 'waiting_for_post') 
                ? 'border-gold/50 ring-2 ring-gold/20' 
                : 'border-white/10'
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
                    className="flex-1 bg-transparent text-white text-sm placeholder-zinc-600 outline-none resize-none min-h-[28px] max-h-[120px] py-1"
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
            {/* Spontan Button - always visible */}
            <SpontanButton userProfile={userProfile} selectedCity={selectedCity} />
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
            <NewMembersWidget onProfileClick={onProfileClick} />
            {loading ? (
                <div className="text-center py-10 text-zinc-600 font-light italic">
                    Loading posts...
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center py-10 text-zinc-600 font-light italic">
                    Quiet night in {selectedCity}... be the first to post.
                </div>
            ) : (
                filteredPosts.map((post, index) => {
                    const ownPost = isOwnPost(post);
                    const involved = isInvolvedInPost(post);
                    const isNewest = index === 0;
                    const isTribeCall = post.tags.includes('TribeCall');
                    const userRSVP = getUserRSVP(post);
                    const relevanceScore = post.relevanceScore || 50;
                    const meetupResponses = post.meetup_responses;
                    const isMIAPost = post.user === 'MIA';
                    const isSpontanPost = post.text.startsWith('⚡ SPONTAN');
                    
                    // Render SpontanCard for spontan posts
                    if (isSpontanPost) {
                      return (
                        <SpontanCard
                          key={post.id}
                          post={post}
                          userProfile={userProfile}
                          onJoin={(postId) => handleRSVP(postId, 'yes')}
                        />
                      );
                    }
                    
                    return (
                    <div 
                      key={post.id} 
                      className={`group border-b border-white/5 pb-4 last:border-0 relative transition-all duration-300 ${
                        isNewest ? 'bg-white/[0.02] -mx-4 px-4 py-3 border border-gold/10 rounded-lg' : ''
                      } ${isMIAPost ? 'bg-gradient-to-r from-gold/5 via-transparent to-transparent border-l-2 border-l-gold -mx-4 px-4 py-3' : ''}`}
                    >
                        {/* Dismiss button */}
                        {!ownPost && !isMIAPost && (
                          <button
                            onClick={() => handleDismissPost(post.id, post.tags)}
                            className="absolute right-0 top-0 p-1.5 text-zinc-700 hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-all"
                            title="Nicht interessant"
                          >
                            <X size={12} />
                          </button>
                        )}
                        
                        {/* Newest badge & Relevance score */}
                        <div className="absolute right-0 top-0 flex items-center gap-2 pr-6">
                          {isMIAPost && (
                            <Badge variant="outline" className="text-[7px] bg-gradient-to-r from-gold/20 to-amber-500/20 text-gold border-gold/30 px-1.5 py-0">
                              COMMUNITY EVENT
                            </Badge>
                          )}
                          {isNewest && !isMIAPost && (
                            <Badge variant="outline" className="text-[7px] bg-gold/10 text-gold border-gold/30 px-1.5 py-0 animate-pulse">
                              NEU
                            </Badge>
                          )}
                          {!isMIAPost && (
                            <span className={`text-[8px] font-medium ${
                              relevanceScore >= 70 ? 'text-green-500' : 
                              relevanceScore >= 50 ? 'text-zinc-500' : 
                              'text-zinc-700'
                            }`}>
                              {relevanceScore}%
                            </span>
                          )}
                        </div>
                        
                        {/* Involvement indicator */}
                        {(ownPost || involved) && !isMIAPost && (
                          <div className="absolute left-0 top-2">
                            <div 
                              className={`w-1.5 h-1.5 rounded-full ${ownPost ? 'bg-gold shadow-[0_0_6px_hsl(var(--gold))]' : 'bg-white/70'}`}
                              title={ownPost ? 'Dein Post' : 'Du hast kommentiert'}
                            />
                          </div>
                        )}
                        
                        {/* Header */}
                        <div className="flex justify-between items-start mb-2 pl-4 pr-16">
                            <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => !isMIAPost && onProfileClick?.(post.user)}
                                  className={`w-7 h-7 rounded-full bg-zinc-800 border flex items-center justify-center overflow-hidden transition-colors ${
                                    isMIAPost 
                                      ? 'border-gold/50 ring-2 ring-gold/30 cursor-default' 
                                      : 'border-white/10 hover:border-gold/50 cursor-pointer'
                                  }`}
                                >
                                    {post.userAvatar ? <img src={post.userAvatar} className="w-full h-full object-cover"/> : <span className="text-[10px] text-zinc-500">{post.user[0]}</span>}
                                </button>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`block font-bold text-[10px] uppercase tracking-wide ${isMIAPost ? 'text-gold' : 'text-white'}`}>{post.user}</span>
                                      {isMIAPost && (
                                        <span className="text-[7px] bg-gradient-to-r from-gold to-amber-500 text-black px-1 py-0.5 rounded font-bold">AI</span>
                                      )}
                                    </div>
                                    <span className="block text-[9px] text-zinc-600">{post.city} • {post.time}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {isTribeCall && (
                                <span className="bg-gold/10 text-gold border border-gold/20 text-[8px] font-bold px-1.5 py-0.5 uppercase tracking-widest rounded-sm">Tribe Call</span>
                              )}
                              {post.tags.filter(t => t !== 'TribeCall' && !t.startsWith('Tribe')).slice(0, 2).map(tag => (
                                <span key={tag} className="bg-white/5 text-zinc-400 border border-white/10 text-[8px] font-medium px-1.5 py-0.5 uppercase tracking-wider rounded-sm">#{tag}</span>
                              ))}
                            </div>
                        </div>

                        {/* Content - Special rendering for #topevents */}
                        {post.text.includes('#topevents') && post.text.includes('<!--topevents:') ? (() => {
                          // Parse structured event cards from the message
                          const match = post.text.match(/<!--topevents:(.*?)-->/s);
                          if (!match) return <p className="text-zinc-200 text-xs font-light leading-relaxed mb-2 pl-[52px]">{post.text}</p>;
                          
                          try {
                            const eventCards = JSON.parse(match[1]) as Array<{
                              id: string; title: string; time: string | null;
                              location: string | null; category: string; image: string; likes: number;
                            }>;
                            const headline = post.text.split('\n')[0];
                            
                            return (
                              <div className="pl-[52px] mb-2">
                                <p className="text-white text-xs font-bold mb-3">{headline}</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {eventCards.map((card) => (
                                    <div key={card.id} className="relative group/card rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-gold/30 transition-all">
                                      {/* Image */}
                                      <div className="aspect-[3/4] relative">
                                        <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                        {/* Category badge */}
                                        <span className="absolute top-1.5 left-1.5 text-[7px] font-bold uppercase tracking-wider bg-black/60 text-white px-1.5 py-0.5 rounded-sm backdrop-blur-sm">
                                          {card.category}
                                        </span>
                                        {/* Content overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-2">
                                          <h4 className="text-[9px] font-bold text-white leading-tight line-clamp-2 mb-1">{card.title}</h4>
                                          {card.time && (
                                            <span className="text-[8px] text-white/70">{card.time} Uhr</span>
                                          )}
                                          {/* CTA Button */}
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleImIn(card.id); }}
                                            className={`mt-1.5 w-full text-[7px] font-bold uppercase tracking-widest py-1 rounded border transition-colors ${
                                              (imInUsers[card.id] || []).includes(userProfile?.username) 
                                                ? 'bg-white text-black border-white' 
                                                : 'bg-black hover:bg-zinc-800 text-white border-white/20'
                                            }`}
                                          >
                                            I'M IN
                                          </button>
                                          {(imInUsers[card.id] || []).length > 0 && (
                                            <p className="text-[7px] text-white/60 mt-0.5 truncate">
                                              {(imInUsers[card.id] || []).slice(0, 2).join(', ')}{(imInUsers[card.id] || []).length > 2 ? ` +${(imInUsers[card.id] || []).length - 2}` : ''}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          } catch {
                            return <p className="text-zinc-200 text-xs font-light leading-relaxed mb-2 pl-[52px]">{post.text}</p>;
                          }
                        })() : (
                          <>
                            <p className="text-zinc-200 text-xs font-light leading-relaxed mb-2 pl-[52px]">
                                {post.text}
                            </p>
                            
                            {/* Post Image */}
                            {post.mediaUrl && (
                              <div className="pl-[52px] mb-2">
                                <img 
                                  src={post.mediaUrl} 
                                  alt="Post image" 
                                  className="max-w-full max-h-64 rounded-lg border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(post.mediaUrl!, '_blank')}
                                />
                              </div>
                            )}
                          </>
                        )}

                        {/* Tags */}
                        {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2 pl-[52px]">
                                {post.tags.map(tag => (
                                    <span key={tag} className="text-[9px] text-zinc-500 hover:text-white transition-colors cursor-pointer">#{tag}</span>
                                ))}
                            </div>
                        )}

                        {/* RSVP - Unified clickable rows with integrated avatars */}
                        {isTribeCall && (
                          <div className="pl-[52px] mb-3 space-y-1.5">
                            {/* Dabei Row */}
                            <button
                              onClick={() => handleRSVP(post.id, 'yes')}
                              className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg transition-all ${
                                userRSVP === 'bin dabei' 
                                  ? 'bg-green-500/15 border border-green-500/30' 
                                  : 'bg-white/[0.03] border border-white/5 hover:border-green-500/20 hover:bg-green-500/5'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                userRSVP === 'bin dabei' ? 'bg-green-500 text-black' : 'bg-white/10 text-zinc-400'
                              }`}>
                                <Check size={12} />
                              </div>
                              <span className={`text-[10px] font-medium flex-shrink-0 ${
                                userRSVP === 'bin dabei' ? 'text-green-400' : 'text-zinc-400'
                              }`}>
                                Dabei
                              </span>
                              {meetupResponses?.['bin dabei']?.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                                  <div className="flex -space-x-1.5 flex-shrink-0">
                                    {meetupResponses['bin dabei'].map((u, i) => (
                                      <div 
                                        key={i} 
                                        className="w-5 h-5 rounded-full border-2 border-black bg-zinc-800 overflow-hidden ring-1 ring-green-500/50"
                                      >
                                        {u.avatar ? (
                                          <img src={u.avatar} className="w-full h-full object-cover" alt={u.username} />
                                        ) : (
                                          <span className="text-[7px] flex items-center justify-center h-full text-green-400 font-bold">{u.username[0]}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <span className="text-[9px] text-green-400/80 truncate">
                                    {meetupResponses['bin dabei'].map(u => u.username).join(', ')}
                                  </span>
                                </div>
                              )}
                            </button>
                            
                            {/* Vielleicht Row */}
                            <button
                              onClick={() => handleRSVP(post.id, 'maybe')}
                              className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg transition-all ${
                                userRSVP === 'vielleicht' 
                                  ? 'bg-yellow-500/15 border border-yellow-500/30' 
                                  : 'bg-white/[0.03] border border-white/5 hover:border-yellow-500/20 hover:bg-yellow-500/5'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                userRSVP === 'vielleicht' ? 'bg-yellow-500 text-black' : 'bg-white/10 text-zinc-400'
                              }`}>
                                <HelpCircle size={12} />
                              </div>
                              <span className={`text-[10px] font-medium flex-shrink-0 ${
                                userRSVP === 'vielleicht' ? 'text-yellow-400' : 'text-zinc-400'
                              }`}>
                                Vielleicht
                              </span>
                              {meetupResponses?.['vielleicht']?.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                                  <div className="flex -space-x-1.5 flex-shrink-0">
                                    {meetupResponses['vielleicht'].map((u, i) => (
                                      <div 
                                        key={i} 
                                        className="w-5 h-5 rounded-full border-2 border-black bg-zinc-800 overflow-hidden ring-1 ring-yellow-500/40"
                                      >
                                        {u.avatar ? (
                                          <img src={u.avatar} className="w-full h-full object-cover" alt={u.username} />
                                        ) : (
                                          <span className="text-[7px] flex items-center justify-center h-full text-yellow-400 font-bold">{u.username[0]}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <span className="text-[9px] text-yellow-400/70 truncate">
                                    {meetupResponses['vielleicht'].map(u => u.username).join(', ')}
                                  </span>
                                </div>
                              )}
                            </button>
                            
                            {/* Nein Row - more subtle but with avatars */}
                            <button
                              onClick={() => handleRSVP(post.id, 'no')}
                              className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg transition-all ${
                                userRSVP === 'diesmal nicht' 
                                  ? 'bg-zinc-800/50 border border-zinc-700' 
                                  : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.02] hover:border-zinc-700'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                userRSVP === 'diesmal nicht' ? 'bg-zinc-600 text-zinc-300' : 'bg-white/10 text-zinc-500'
                              }`}>
                                <X size={12} />
                              </div>
                              <span className={`text-[10px] font-medium flex-shrink-0 ${
                                userRSVP === 'diesmal nicht' ? 'text-zinc-400' : 'text-zinc-500'
                              }`}>
                                Diesmal nicht
                              </span>
                              {meetupResponses?.['diesmal nicht']?.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
                                  <div className="flex -space-x-1.5 flex-shrink-0">
                                    {meetupResponses['diesmal nicht'].map((u, i) => (
                                      <div 
                                        key={i} 
                                        className="w-5 h-5 rounded-full border-2 border-black bg-zinc-800 overflow-hidden ring-1 ring-zinc-600/50"
                                      >
                                        {u.avatar ? (
                                          <img src={u.avatar} className="w-full h-full object-cover" alt={u.username} />
                                        ) : (
                                          <span className="text-[7px] flex items-center justify-center h-full text-zinc-400 font-bold">{u.username[0]}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <span className="text-[9px] text-zinc-500 truncate">
                                    {meetupResponses['diesmal nicht'].map(u => u.username).join(', ')}
                                  </span>
                                </div>
                              )}
                            </button>
                          </div>
                        )}

                        {/* Latest comment preview for newest post */}
                        {isNewest && post.comments && post.comments.length > 0 && expandedPostId !== post.id && (
                          <div className="mb-2 pl-[52px] border-l-2 border-gold/30 ml-[52px]">
                            <div className="pl-2 py-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9px] font-bold text-gold">{post.comments[post.comments.length - 1].user}</span>
                                <span className="text-[8px] text-zinc-600">{post.comments[post.comments.length - 1].time}</span>
                              </div>
                              <p className="text-[10px] text-zinc-400 line-clamp-2">{post.comments[post.comments.length - 1].text}</p>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-5 pl-[52px]">
                            {/* Like button with who liked */}
                            <button 
                              onClick={() => handleLike(post.id)} 
                              className={`flex items-center gap-1.5 transition-colors ${
                                post.likedBy?.includes(userProfile.username) ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'
                              }`}
                            >
                                <Heart size={14} fill={post.likedBy?.includes(userProfile.username) ? 'currentColor' : 'none'} />
                                {(post.likes || 0) > 0 && (
                                  <span className="text-[9px] font-medium text-zinc-400 truncate max-w-[120px]">
                                    {post.likedBy?.slice(0, 3).join(', ')}{(post.likedBy?.length || 0) > 3 ? ` +${(post.likedBy?.length || 0) - 3}` : ''}
                                  </span>
                                )}
                            </button>
                            
                            {/* Comment button with count */}
                            <button 
                              onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} 
                              className={`flex items-center gap-1.5 transition-colors ${
                                expandedPostId === post.id ? 'text-white' : 'text-zinc-500 hover:text-white'
                              }`}
                            >
                                <div className="relative">
                                  <MessageCircle size={14} className={`${(post.comments?.length || 0) > 0 && expandedPostId !== post.id ? 'animate-pulse text-gold' : ''}`} />
                                </div>
                                <span className={`text-[10px] font-bold ${(post.comments?.length || 0) > 0 ? 'text-white' : 'text-zinc-600'}`}>
                                  {post.comments?.length || 0}
                                </span>
                                {(post.comments?.length || 0) > 0 && (
                                  <span className="text-[9px] text-zinc-400 truncate max-w-[120px]">
                                    {[...new Set(post.comments?.map(c => c.user) || [])].slice(0, 3).join(', ')}{[...new Set(post.comments?.map(c => c.user) || [])].length > 3 ? ` +${[...new Set(post.comments?.map(c => c.user) || [])].length - 3}` : ''}
                                  </span>
                                )}
                            </button>
                        </div>

                        {/* Thread / Comments */}
                        {expandedPostId === post.id && (
                            <div className="mt-3 pl-[52px] animate-fadeIn">
                                {/* Comment List */}
                                {post.comments && post.comments.length > 0 && (
                                    <div className="space-y-2 mb-3 border-l border-white/10 pl-3">
                                        {post.comments.map(comment => (
                                            <div key={comment.id}>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[9px] font-bold text-white">{comment.user}</span>
                                                    <span className="text-[8px] text-zinc-600">{comment.time}</span>
                                                </div>
                                                <p className="text-[10px] text-zinc-400">{comment.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {/* Reply Input */}
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Add a reply..."
                                        className="flex-1 bg-zinc-900 border border-white/5 px-2.5 py-1.5 text-[10px] text-white outline-none focus:border-white/20"
                                        onKeyDown={(e) => e.key === 'Enter' && handleReply(post.id)}
                                    />
                                    <button onClick={() => handleReply(post.id)} className="bg-white/10 text-white p-1.5 hover:bg-white/20 transition-colors">
                                        <Send size={12} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    );
                })
            )}
        </div>
    </div>
  );
};
