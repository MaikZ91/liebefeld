import React, { useState, useEffect } from 'react';
import { UserProfile, Post, Comment } from '@/types/tribe';
import { enhancePostContent } from '@/services/tribe/aiHelpers';
import { ArrowRight, Sparkles, Heart, MessageCircle, Share2, Hash, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  selectedCity: string;
  userProfile: UserProfile;
}

type Tab = 'ALL' | 'CREW' | 'TIPS';

const TRIBE_BOARD_GROUP_ID = 'tribe_community_board';

export const TribeCommunityBoard: React.FC<Props> = ({ selectedCity, userProfile }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

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

  const convertMessageToPost = (msg: any): Post => {
    const reactions = msg.reactions as { emoji: string; users: string[] }[] || [];
    const likes = reactions.reduce((sum, r) => sum + (r.users?.length || 0), 0);
    
    // Extract tags from text (hashtags)
    const tags: string[] = [];
    const hashtagRegex = /#(\w+)/g;
    let match;
    while ((match = hashtagRegex.exec(msg.text)) !== null) {
      tags.push(match[1]);
    }

    return {
      id: msg.id,
      user: msg.sender,
      text: msg.text,
      city: selectedCity,
      likes,
      time: formatTime(msg.created_at),
      tags,
      userAvatar: msg.avatar,
      comments: []
    };
  };

  const convertMessageToComment = (msg: any): Comment => {
    return {
      id: msg.id,
      user: msg.sender,
      text: msg.text,
      time: formatTime(msg.created_at),
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

  const filteredPosts = posts.filter(p => {
      if (selectedCity !== 'All' && p.city !== selectedCity) return false;
      if (activeTab === 'CREW') return p.tags.includes('CrewCall') || p.tags.includes('Connect');
      if (activeTab === 'TIPS') return p.tags.includes('Question') || p.tags.includes('Tip');
      return true;
  });

  const handleOptimize = async () => {
      if (!newPost.trim()) return;
      setIsOptimizing(true);
      const result = await enhancePostContent(newPost);
      setNewPost(result.optimizedText);
      setGeneratedTags(result.hashtags);
      setIsOptimizing(false);
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    
    // Auto-tag 'CrewCall' if text implies it (simple check for demo)
    const tags = [...generatedTags];
    if (newPost.toLowerCase().includes('suche') || newPost.toLowerCase().includes('crew') || newPost.toLowerCase().includes('wer')) {
        if (!tags.includes('CrewCall')) tags.push('CrewCall');
    }

    // Add hashtags to text
    let postText = newPost;
    if (tags.length > 0) {
      postText += '\n\n' + tags.map(t => `#${t}`).join(' ');
    }

    try {
      await supabase
        .from('chat_messages')
        .insert({
          group_id: TRIBE_BOARD_GROUP_ID,
          sender: userProfile.username,
          text: postText,
          avatar: userProfile.avatarUrl || userProfile.avatar || null
        });

      setNewPost('');
      setGeneratedTags([]);
    } catch (error) {
      console.error('Error posting:', error);
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
    <div className="h-full flex flex-col bg-black animate-fadeIn">
        
        {/* --- INPUT AREA --- */}
        <div className="p-6 border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur-xl z-20">
            <h2 className="font-serif text-2xl text-gold mb-4 italic">The Tribe Board</h2>
            
            <div className="bg-surface border border-white/10 rounded-xl p-3 shadow-lg">
                <textarea 
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder={`What's happening in ${selectedCity}?`}
                    className="w-full bg-transparent text-white text-sm placeholder-zinc-600 outline-none resize-none h-16"
                />
                
                {/* Tags Preview */}
                {generatedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {generatedTags.map(tag => (
                            <span key={tag} className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">#{tag}</span>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                    <button 
                        onClick={handleOptimize} 
                        disabled={isOptimizing || !newPost}
                        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-gold transition-colors disabled:opacity-50"
                    >
                        <Sparkles size={14} className={isOptimizing ? "animate-spin" : ""} />
                        {isOptimizing ? 'Optimizing...' : 'AI Enhance'}
                    </button>

                    <button 
                        onClick={handlePost} 
                        disabled={!newPost} 
                        className="bg-gold hover:bg-white text-black text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors disabled:opacity-50"
                    >
                        Post
                    </button>
                </div>
            </div>
        </div>

        {/* --- CHANNELS / TABS --- */}
        <div className="px-6 py-4 flex gap-4 overflow-x-auto no-scrollbar border-b border-white/5">
            {[
                { id: 'ALL', label: 'All Posts' },
                { id: 'CREW', label: 'Crew Search' },
                { id: 'TIPS', label: 'Insider Tips' }
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-all ${activeTab === tab.id ? 'bg-white text-black' : 'text-zinc-500 hover:text-white border border-white/10'}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {/* --- FEED --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
            {loading ? (
                <div className="text-center py-10 text-zinc-600 font-light italic">
                    Loading posts...
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center py-10 text-zinc-600 font-light italic">
                    Quiet night in {selectedCity}... be the first to post.
                </div>
            ) : (
                filteredPosts.map(post => (
                    <div key={post.id} className="group border-b border-white/5 pb-6 last:border-0">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                                    {post.userAvatar ? <img src={post.userAvatar} className="w-full h-full object-cover"/> : <span className="text-xs text-zinc-500">{post.user[0]}</span>}
                                </div>
                                <div>
                                    <span className="block font-bold text-white text-xs uppercase tracking-wide">{post.user}</span>
                                    <span className="block text-[10px] text-zinc-600">{post.city} • {post.time}</span>
                                </div>
                            </div>
                            {post.tags.includes('CrewCall') && (
                                <span className="bg-gold/10 text-gold border border-gold/20 text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest rounded-sm">Crew Call</span>
                            )}
                        </div>

                        {/* Content */}
                        <p className="text-zinc-200 text-sm font-light leading-relaxed mb-3 pl-11">
                            {post.text}
                        </p>

                        {/* Tags */}
                        {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4 pl-11">
                                {post.tags.map(tag => (
                                    <span key={tag} className="text-[10px] text-zinc-500 hover:text-white transition-colors cursor-pointer">#{tag}</span>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-6 pl-11">
                            <button onClick={() => handleLike(post.id)} className="flex items-center gap-2 text-zinc-500 hover:text-red-500 transition-colors group/like">
                                <Heart size={16} className={post.likes > 0 ? "fill-red-500 text-red-500" : "group-hover/like:text-red-500"} />
                                <span className="text-[10px] font-medium">{post.likes || 0}</span>
                            </button>
                            
                            <button onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
                                <MessageCircle size={16} />
                                <span className="text-[10px] font-medium">{post.comments?.length || 0}</span>
                            </button>
                            
                            <button className="text-zinc-500 hover:text-gold transition-colors ml-auto">
                                <Share2 size={16} />
                            </button>
                        </div>

                        {/* Thread / Comments */}
                        {expandedPostId === post.id && (
                            <div className="mt-4 pl-11 animate-fadeIn">
                                {/* Comment List */}
                                {post.comments && post.comments.length > 0 && (
                                    <div className="space-y-3 mb-4 border-l border-white/10 pl-4">
                                        {post.comments.map(comment => (
                                            <div key={comment.id}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-white">{comment.user}</span>
                                                    <span className="text-[9px] text-zinc-600">{comment.time}</span>
                                                </div>
                                                <p className="text-xs text-zinc-400">{comment.text}</p>
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
                                        className="flex-1 bg-zinc-900 border border-white/5 px-3 py-2 text-xs text-white outline-none focus:border-white/20"
                                        onKeyDown={(e) => e.key === 'Enter' && handleReply(post.id)}
                                    />
                                    <button onClick={() => handleReply(post.id)} className="bg-white/10 text-white p-2 hover:bg-white/20 transition-colors">
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
  );
};
