import React, { useState } from 'react';
import { Post, UserProfile } from '@/types/tribe';
import { Heart, MessageCircle, Share2, Sparkles, X } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'ALL' | 'CREW' | 'TIPS'>('ALL');
  const [newPostText, setNewPostText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const handleCreatePost = () => {
    if (!newPostText.trim()) return;

    const newPost: Post = {
      id: Date.now().toString(),
      user: userProfile.username,
      text: newPostText,
      city: selectedCity,
      likes: 0,
      time: 'Just now',
      tags: [],
      userAvatar: userProfile.avatarUrl,
      comments: [],
    };

    onPostsChange([newPost, ...posts]);
    setNewPostText('');
  };

  const handleLikePost = (postId: string) => {
    const updated = posts.map(p =>
      p.id === postId ? { ...p, likes: p.likes + 1 } : p
    );
    onPostsChange(updated);
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;

    const updated = posts.map(p => {
      if (p.id === postId) {
        const newComment = {
          id: Date.now().toString(),
          user: userProfile.username,
          text: commentText,
          time: 'Just now',
          userAvatar: userProfile.avatarUrl,
        };
        return { ...p, comments: [...(p.comments || []), newComment] };
      }
      return p;
    });

    onPostsChange(updated);
    setCommentText('');
    setShowCommentInput(null);
  };

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'CREW') return p.isCrewCall;
    if (activeTab === 'TIPS') return p.tags.includes('tip');
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-6 border-b border-white/10">
        <h2 className="text-2xl font-serif italic text-gold mb-1">The Tribe Board</h2>
        <p className="text-xs text-zinc-500 uppercase tracking-wider">{selectedCity}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 py-3 border-b border-white/10">
        {(['ALL', 'CREW', 'TIPS'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              activeTab === tab
                ? 'bg-white text-black'
                : 'bg-white/10 text-zinc-400 hover:bg-white/20'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 px-5 py-3 border-b border-white/10">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-gold/10 text-gold border border-gold/30 text-xs hover:bg-gold/20 transition-colors">
          <Sparkles size={14} />
          AI Optimize
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white border border-white/10 text-xs hover:bg-white/20 transition-colors">
          <Share2 size={14} />
          Share
        </button>
      </div>

      {/* New Post Input */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {userProfile.avatarUrl ? (
              <img src={userProfile.avatarUrl} className="w-full h-full object-cover" alt={userProfile.username} />
            ) : (
              <span className="text-xs text-zinc-500">{userProfile.username[0]}</span>
            )}
          </div>
          <div className="flex-1">
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="Share with the tribe..."
              className="w-full bg-zinc-900/50 border border-white/10 text-white text-sm p-2 rounded resize-none focus:outline-none focus:border-gold/50"
              rows={2}
            />
            <button
              onClick={handleCreatePost}
              disabled={!newPostText.trim()}
              className="mt-2 px-4 py-1.5 bg-white text-black text-xs font-bold uppercase tracking-wide hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {filteredPosts.map(post => (
          <div key={post.id} className="bg-zinc-900/30 border border-white/10 p-4 rounded">
            {/* Post Header */}
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                  {post.userAvatar ? (
                    <img src={post.userAvatar} className="w-full h-full object-cover" alt={post.user} />
                  ) : (
                    <span className="text-xs text-zinc-500">{post.user[0]}</span>
                  )}
                </div>
                <div>
                  <span className="block font-bold text-white text-xs uppercase tracking-wide">{post.user}</span>
                  <span className="block text-[10px] text-zinc-600">{post.city} • {post.time}</span>
                </div>
              </div>
              {post.isCrewCall && (
                <span className="px-2 py-0.5 bg-gold/20 text-gold text-[9px] font-bold uppercase tracking-wider border border-gold/30">
                  Crew Call
                </span>
              )}
            </div>

            {/* Post Content */}
            <p className="text-sm text-zinc-300 leading-relaxed mb-3">{post.text}</p>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-gold">#{tag}</span>
                ))}
              </div>
            )}

            {/* Post Actions */}
            <div className="flex items-center gap-4 text-zinc-500">
              <button
                onClick={() => handleLikePost(post.id)}
                className="flex items-center gap-1.5 hover:text-gold transition-colors"
              >
                <Heart size={16} />
                <span className="text-xs">{post.likes}</span>
              </button>
              <button
                onClick={() => setShowCommentInput(showCommentInput === post.id ? null : post.id)}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <MessageCircle size={16} />
                <span className="text-xs">{post.comments?.length || 0}</span>
              </button>
            </div>

            {/* Comments */}
            {post.comments && post.comments.length > 0 && (
              <div className="mt-4 space-y-3 pl-4 border-l border-white/10">
                {post.comments.map(comment => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {comment.userAvatar ? (
                        <img src={comment.userAvatar} className="w-full h-full object-cover" alt={comment.user} />
                      ) : (
                        <span className="text-[10px] text-zinc-500">{comment.user[0]}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-white uppercase">{comment.user}</span>
                        <span className="text-[9px] text-zinc-600">{comment.time}</span>
                      </div>
                      <p className="text-xs text-zinc-400">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Input */}
            {showCommentInput === post.id && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-zinc-900/50 border border-white/10 text-white text-xs px-3 py-1.5 rounded focus:outline-none focus:border-gold/50"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  disabled={!commentText.trim()}
                  className="px-3 py-1.5 bg-white text-black text-[10px] font-bold uppercase hover:bg-zinc-200 transition-colors disabled:opacity-30"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
