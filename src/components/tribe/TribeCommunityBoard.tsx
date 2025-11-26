import React, { useState } from 'react';
import { UserProfile, Post } from '@/types/tribe';
import { enhancePostContent } from '@/services/tribe/aiHelpers';
import { Heart, MessageCircle, Send, Sparkles, Hash } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [newPostText, setNewPostText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!newPostText.trim() || enhancing) return;
    setEnhancing(true);
    
    const { optimizedText, hashtags } = await enhancePostContent(newPostText);
    setNewPostText(optimizedText);
    setEnhancing(false);
  };

  const handlePost = () => {
    if (!newPostText.trim()) return;
    
    const tags = newPostText.match(/#\w+/g)?.map(t => t.slice(1)) || [];
    
    const newPost: Post = {
      id: Date.now().toString(),
      user: userProfile.username,
      text: newPostText,
      city: selectedCity,
      likes: 0,
      time: 'Just now',
      tags,
      userAvatar: userProfile.avatarUrl,
      comments: [],
    };
    
    onPostsChange([newPost, ...posts]);
    setNewPostText('');
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
    setActiveReplyId(null);
  };

  const handleLike = (postId: string) => {
    const updatedPosts = posts.map(p =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    );
    onPostsChange(updatedPosts);
  };

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h2 className="text-white text-xl font-bold mb-1">Community</h2>
        <p className="text-zinc-500 text-sm">{selectedCity}</p>
      </div>

      {/* Create Post */}
      <div className="p-4 border-b border-white/10 bg-zinc-900/30">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={userProfile.avatarUrl} />
            <AvatarFallback>{userProfile.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <Textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="What's happening tonight?"
              className="bg-black/50 border-white/10 text-white text-sm min-h-[80px] resize-none"
            />
            
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleEnhance}
                disabled={!newPostText.trim() || enhancing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-500 hover:text-gold transition-colors disabled:opacity-50 border border-white/10 rounded"
              >
                <Sparkles size={12} />
                {enhancing ? 'Enhancing...' : 'AI Enhance'}
              </button>
              
              <div className="flex-1" />
              
              <button
                onClick={handlePost}
                disabled={!newPostText.trim()}
                className="bg-gold hover:bg-gold-light text-black text-xs font-bold px-4 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-white/5">
          {posts.map((post) => (
            <div key={post.id} className="p-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={post.userAvatar} />
                  <AvatarFallback>{post.user[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-white font-semibold text-sm">{post.user}</span>
                      <span className="text-zinc-600 text-xs ml-2">{post.time}</span>
                    </div>
                    {post.isCrewCall && (
                      <span className="text-[9px] bg-gold/20 text-gold px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Crew Call
                      </span>
                    )}
                  </div>
                  
                  <p className="text-zinc-300 text-sm leading-relaxed mb-2 whitespace-pre-wrap">
                    {post.text}
                  </p>
                  
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-zinc-500 hover:text-gold transition-colors cursor-pointer flex items-center gap-0.5"
                        >
                          <Hash size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 transition-colors text-xs"
                    >
                      <Heart size={14} />
                      <span>{post.likes}</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveReplyId(activeReplyId === post.id ? null : post.id)}
                      className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-xs"
                    >
                      <MessageCircle size={14} />
                      <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>
                  
                  {/* Comments */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="mt-3 space-y-2 pl-3 border-l border-white/10">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <Avatar className="w-6 h-6 flex-shrink-0">
                            <AvatarImage src={comment.userAvatar} />
                            <AvatarFallback>{comment.user[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-white font-medium text-xs">{comment.user}</span>
                              <span className="text-zinc-600 text-[10px]">{comment.time}</span>
                            </div>
                            <p className="text-zinc-400 text-xs">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Reply Input */}
                  {activeReplyId === post.id && (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleReply(post.id)}
                        placeholder="Write a reply..."
                        className="flex-1 bg-black/50 border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-gold/50 transition-colors"
                      />
                      <button
                        onClick={() => handleReply(post.id)}
                        disabled={!replyText.trim()}
                        className="text-gold hover:text-gold-light transition-colors disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
