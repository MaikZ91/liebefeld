import React, { useState } from 'react';
import { UserProfile, Post } from '@/types/tribe';
import { enhancePostContent } from '@/services/tribe/aiHelpers';
import { Heart, MessageCircle, Send, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Tab = 'ALL' | 'CREW' | 'TIPS';

interface TribeCommunityBoardProps {
  selectedCity: string;
  userProfile: UserProfile;
  posts: Post[];
  onPostsChange: (posts: Post[]) => void;
}

export const TribeCommunityBoard: React.FC<TribeCommunityBoardProps> = ({
  selectedCity,
  userProfile,
  posts,
  onPostsChange,
}) => {
  const [newPost, setNewPost] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('ALL');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredPosts = posts.filter(p => {
    if (selectedCity !== 'All' && p.city !== selectedCity) return false;
    if (activeTab === 'CREW') return p.isCrewCall;
    if (activeTab === 'TIPS') return p.tags.includes('Question') || p.tags.includes('Tip');
    return true;
  });

  const handleOptimize = async () => {
    if (!newPost.trim() || isOptimizing) return;
    setIsOptimizing(true);
    
    const { optimizedText, hashtags } = await enhancePostContent(newPost);
    setNewPost(optimizedText);
    setGeneratedTags(hashtags);
    setIsOptimizing(false);
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    
    const tags = [...new Set([...generatedTags, ...newPost.match(/#\w+/g)?.map(t => t.slice(1)) || []])];
    
    const post: Post = {
      id: Date.now().toString(),
      user: userProfile.username,
      text: newPost,
      city: selectedCity,
      likes: 0,
      time: 'Just now',
      tags,
      userAvatar: userProfile.avatarUrl,
      comments: [],
      isCrewCall: tags.includes('CrewCall')
    };
    
    onPostsChange([post, ...posts]);
    setNewPost('');
    setGeneratedTags([]);
  };

  const handleReply = (postId: string) => {
    if (!replyText.trim()) return;
    
    const updatedPosts = posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...(p.comments || []),
            {
              id: Date.now().toString(),
              user: userProfile.username,
              text: replyText,
              time: 'Just now',
              userAvatar: userProfile.avatarUrl,
            },
          ],
        };
      }
      return p;
    });
    
    onPostsChange(updatedPosts);
    setReplyText('');
  };

  const handleLike = (postId: string) => {
    const updatedPosts = posts.map(p =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    );
    onPostsChange(updatedPosts);
  };

  const tabs = [
    { id: 'ALL', label: 'All' },
    { id: 'CREW', label: 'Crew Calls' },
    { id: 'TIPS', label: 'Tips & Q&A' },
  ];

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Input Area */}
      <div className="p-6 border-b border-white/10 sticky top-0 bg-black/95 backdrop-blur-xl z-20">
        <h2 className="font-serif text-2xl text-gold mb-4 italic">The Tribe Board</h2>
        
        <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 shadow-lg">
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
              <Sparkles size={14} />
              {isOptimizing ? 'Optimizing...' : 'AI Optimize'}
            </button>
            
            <button
              onClick={handlePost}
              disabled={!newPost.trim()}
              className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold px-4 py-2 transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-6 py-4 border-b border-white/5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-black' 
                : 'text-zinc-500 hover:text-white border border-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 font-light italic">
            Quiet night in {selectedCity}... be the first to post.
          </div>
        ) : (
          filteredPosts.map(post => (
            <div key={post.id} className="group border-b border-white/5 pb-6 last:border-0">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={post.userAvatar} />
                    <AvatarFallback className="bg-zinc-800 border border-white/10 text-zinc-500 text-xs">
                      {post.user[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-white text-sm font-medium">{post.user}</div>
                    <div className="text-zinc-600 text-[10px] uppercase tracking-wider">{post.time} · {post.city}</div>
                  </div>
                </div>
                
                {post.isCrewCall && (
                  <span className="text-[9px] bg-gold/20 text-gold px-2 py-1 font-bold uppercase tracking-wider border border-gold/30">
                    Crew Call
                  </span>
                )}
              </div>
              
              {/* Content */}
              <p className="text-zinc-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                {post.text}
              </p>
              
              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] text-zinc-500 hover:text-gold transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center gap-4 text-zinc-600">
                <button
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-1.5 text-xs hover:text-red-400 transition-colors"
                >
                  <Heart size={14} />
                  <span>{post.likes}</span>
                </button>
                
                <button
                  onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}
                  className="flex items-center gap-1.5 text-xs hover:text-white transition-colors"
                >
                  <MessageCircle size={14} />
                  <span>{post.comments?.length || 0}</span>
                </button>
              </div>
              
              {/* Comments */}
              {expandedPostId === post.id && (
                <div className="mt-4 pl-11 space-y-3">
                  {post.comments?.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarImage src={comment.userAvatar} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-500 text-[10px]">
                          {comment.user[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-white font-medium text-xs">{comment.user}</span>
                          <span className="text-zinc-600 text-[10px]">{comment.time}</span>
                        </div>
                        <p className="text-zinc-400 text-xs">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Reply Input */}
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReply(post.id)}
                      placeholder="Write a reply..."
                      className="flex-1 bg-zinc-900 border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold/50 transition-colors"
                    />
                    <button
                      onClick={() => handleReply(post.id)}
                      disabled={!replyText.trim()}
                      className="text-gold hover:text-gold/80 transition-colors disabled:opacity-50"
                    >
                      <Send size={16} />
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
