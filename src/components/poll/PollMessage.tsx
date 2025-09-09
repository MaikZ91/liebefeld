import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, BarChart3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { getInitials } from '@/utils/chatUIUtils';
import { cn } from '@/lib/utils';

interface PollData {
  question: string;
  options: string[];
  votes?: { [optionIndex: number]: { username: string; avatar?: string }[] }; // option index -> array of user objects
}

interface PollMessageProps {
  pollData: PollData;
  messageId: string;
  onVote?: (optionIndex: number, messageId: string) => void;
  isConsecutive?: boolean;
}

const PollMessage: React.FC<PollMessageProps> = ({
  pollData,
  messageId,
  onVote,
  isConsecutive = false
}) => {
  console.log('PollMessage: Received pollData:', pollData);
  
  // Parse options if they come as a string
  let safeOptions = [];
  try {
    if (Array.isArray(pollData.options)) {
      safeOptions = pollData.options;
    } else if (typeof pollData.options === 'string') {
      safeOptions = JSON.parse(pollData.options);
    }
  } catch (e) {
    console.error('PollMessage: Error parsing options:', e, pollData.options);
    safeOptions = [];
  }
  
  console.log('PollMessage: Parsed options:', safeOptions);
  
  if (safeOptions.length === 0) {
    console.error('PollMessage: No valid options found', pollData);
    return <div className="text-red-500">Error: Invalid poll data</div>;
  }

  const [votes, setVotes] = useState<{ [optionIndex: number]: { username: string; avatar?: string }[] }>(pollData.votes || {});
  const [userVote, setUserVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  const currentUser = localStorage.getItem(USERNAME_KEY) || 'Anonymous';
  const currentUserAvatar = localStorage.getItem(AVATAR_KEY) || null;

  useEffect(() => {
    // Check if current user has already voted
    for (let optionIndex in votes) {
      if (votes[optionIndex].some(vote => vote.username === currentUser)) {
        setUserVote(parseInt(optionIndex));
        break;
      }
    }
  }, [votes, currentUser]);

  const handleVote = async (optionIndex: number) => {
    if (userVote !== null || loading) return; // Already voted or loading
    
    setLoading(true);
    
    try {
      // Update local state optimistically
      const newVotes = { ...votes };
      if (!newVotes[optionIndex]) {
        newVotes[optionIndex] = [];
      }
      newVotes[optionIndex] = [...newVotes[optionIndex], { 
        username: currentUser, 
        avatar: currentUserAvatar 
      }];
      
      setVotes(newVotes);
      setUserVote(optionIndex);

      // Update in database
      const { error } = await supabase
        .from('chat_messages')
        .update({ 
          poll_votes: newVotes as any
        })
        .eq('id', messageId);

      if (error) {
        console.error('Error updating poll vote:', error);
        // Revert optimistic update on error
        setVotes(pollData.votes || {});
        setUserVote(null);
      }

      // Call external handler if provided
      if (onVote) {
        onVote(optionIndex, messageId);
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
      // Revert optimistic update on error
      setVotes(pollData.votes || {});
      setUserVote(null);
    } finally {
      setLoading(false);
    }
  };

  const getTotalVotes = () => {
    return Object.values(votes).reduce((total, voters) => total + voters.length, 0);
  };

  const getOptionPercentage = (optionIndex: number) => {
    const totalVotes = getTotalVotes();
    if (totalVotes === 0) return 0;
    const optionVotes = votes[optionIndex]?.length || 0;
    return Math.round((optionVotes / totalVotes) * 100);
  };

  const getOptionVotes = (optionIndex: number) => {
    return votes[optionIndex]?.length || 0;
  };

  const getOptionVoters = (optionIndex: number) => {
    return votes[optionIndex] || [];
  };

  const totalVotes = getTotalVotes();

  return (
    <div 
      className={cn(
        "group px-6 py-5 rounded-3xl relative w-full max-w-full overflow-hidden transition-all duration-300 text-white hover:scale-[1.01] transform-gpu",
        isConsecutive ? "mt-2" : "mt-3"
      )}
      style={{ 
        background: 'linear-gradient(135deg, hsl(var(--poll-glass-bg)), hsl(var(--poll-glass-bg) / 0.6))',
        border: '1px solid hsl(var(--poll-border))',
        borderTop: '2px solid hsl(var(--poll-accent))',
        borderRadius: '24px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 40px -12px hsl(var(--poll-shadow) / 0.4), 0 0 0 1px hsl(var(--poll-border))'
      }}
    >
      {/* Ambient glow effect */}
      <div 
        className="absolute inset-0 opacity-30 animate-poll-glow"
        style={{
          background: 'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), hsl(var(--poll-accent) / 0.1), transparent 40%)',
          borderRadius: '24px'
        }}
      />
      
      <div className="flex flex-col relative z-10">
        {/* Elegant Poll Header */}
        <div className="flex items-start gap-4 mb-6">
          <div 
            className="p-3 rounded-2xl relative overflow-hidden animate-poll-glow"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--poll-gradient-start) / 0.2), hsl(var(--poll-gradient-end) / 0.2))',
              backdropFilter: 'blur(10px)',
              border: '1px solid hsl(var(--poll-border))'
            }}
          >
            <BarChart3 className="h-6 w-6 text-white flex-shrink-0" />
            <div className="absolute inset-0 animate-poll-shimmer opacity-30"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-white break-words leading-relaxed tracking-wide">
              {pollData.question}
            </p>
          </div>
        </div>
        
        {/* Elegant Poll Options */}
        <div className="space-y-4">
        {safeOptions.map((option, index) => {
          const percentage = getOptionPercentage(index);
          const optionVotes = getOptionVotes(index);
          const voters = getOptionVoters(index);
          const isSelected = userVote === index;
          const hasVoted = userVote !== null;
          
          return (
            <div key={index} className="space-y-3">
              <div className="relative group">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left relative overflow-hidden transition-all duration-500 h-14 rounded-2xl ${
                    hasVoted ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02] hover:shadow-2xl transform-gpu'
                  }`}
                  style={{
                    background: isSelected 
                      ? `linear-gradient(135deg, hsl(var(--poll-gradient-start) / 0.3), hsl(var(--poll-gradient-end) / 0.3))`
                      : hasVoted 
                        ? 'hsl(var(--poll-option-bg))' 
                        : 'hsl(var(--poll-option-bg))',
                    border: isSelected 
                      ? '2px solid hsl(var(--poll-accent))' 
                      : '1px solid hsl(var(--poll-border))',
                    backdropFilter: 'blur(10px)',
                    boxShadow: isSelected 
                      ? '0 8px 32px hsl(var(--poll-shadow)), 0 0 0 1px hsl(var(--poll-accent) / 0.5)' 
                      : hasVoted 
                        ? '0 4px 20px hsl(var(--poll-shadow) / 0.2)' 
                        : 'none'
                  }}
                  onClick={() => handleVote(index)}
                  disabled={hasVoted || loading}
                  onMouseEnter={(e) => {
                    if (!hasVoted) {
                      e.currentTarget.style.background = 'hsl(var(--poll-option-hover))';
                      e.currentTarget.style.borderColor = 'hsl(var(--poll-accent) / 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!hasVoted && !isSelected) {
                      e.currentTarget.style.background = 'hsl(var(--poll-option-bg))';
                      e.currentTarget.style.borderColor = 'hsl(var(--poll-border))';
                    }
                  }}
                >
                  {/* Option letter indicator */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/80 z-20">
                    {String.fromCharCode(65 + index)}
                  </div>
                  
                  <div className="flex items-center justify-between w-full z-10 relative pl-14 pr-4">
                    <span className="text-sm font-medium flex-1 mr-3 text-white/95 leading-relaxed">
                      {option}
                    </span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-white animate-scale-in drop-shadow-lg" />
                      )}
                      {hasVoted && (
                        <div 
                          className="text-xs font-bold text-white/95 px-3 py-1.5 rounded-xl backdrop-blur-sm"
                          style={{
                            background: 'hsl(var(--poll-glass-bg) / 0.6)',
                            border: '1px solid hsl(var(--poll-border))'
                          }}
                        >
                          {optionVotes} • {percentage}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Elegant progress bar */}
                  {hasVoted && (
                    <div 
                      className="absolute inset-0 rounded-2xl opacity-20 animate-poll-fill"
                      style={{ 
                        background: `linear-gradient(90deg, hsl(var(--poll-gradient-start) / 0.4) 0%, hsl(var(--poll-gradient-end) / 0.3) 100%)`,
                        width: `${percentage}%`,
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  )}
                  
                  {/* Shimmer effect for interactive options */}
                  {!hasVoted && (
                    <div className="absolute inset-0 animate-poll-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                  )}
                </Button>
              </div>
              
              {/* Elegant voter avatars */}
              {voters.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-16 animate-fade-in">
                  {voters.slice(0, 6).map((voter, voterIndex) => (
                    <div key={`${voter.username}-${voterIndex}`} className="group/avatar relative">
                      <Avatar 
                        className="h-8 w-8 border-2 transition-all duration-300 hover:scale-125 transform-gpu cursor-pointer"
                        style={{
                          borderColor: 'hsl(var(--poll-accent) / 0.6)',
                          boxShadow: '0 4px 12px hsl(var(--poll-shadow) / 0.3)'
                        }}
                      >
                        <AvatarImage src={voter.avatar || undefined} alt={voter.username} />
                        <AvatarFallback 
                          className="text-white text-xs font-bold"
                          style={{
                            background: 'linear-gradient(135deg, hsl(var(--poll-gradient-start)), hsl(var(--poll-gradient-end)))'
                          }}
                        >
                          {getInitials(voter.username)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Elegant tooltip */}
                      <div 
                        className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-xl text-xs font-medium text-white opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-30 shadow-lg"
                        style={{
                          background: 'hsl(var(--poll-glass-bg))',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid hsl(var(--poll-border))'
                        }}
                      >
                        {voter.username}
                        <div 
                          className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45"
                          style={{
                            background: 'hsl(var(--poll-glass-bg))',
                            border: '1px solid hsl(var(--poll-border))',
                            borderTop: 'none',
                            borderLeft: 'none'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {voters.length > 6 && (
                    <div 
                      className="h-8 w-8 rounded-full flex items-center justify-center group/more hover:scale-125 transition-all duration-300 cursor-pointer transform-gpu"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--poll-option-bg)), hsl(var(--poll-option-hover)))',
                        border: '2px solid hsl(var(--poll-accent) / 0.6)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px hsl(var(--poll-shadow) / 0.3)'
                      }}
                    >
                      <span className="text-xs text-white font-bold">+{voters.length - 6}</span>
                      {/* Elegant overflow tooltip */}
                      <div 
                        className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-xl text-xs font-medium text-white opacity-0 group-hover/more:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-30 shadow-lg"
                        style={{
                          background: 'hsl(var(--poll-glass-bg))',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid hsl(var(--poll-border))'
                        }}
                      >
                        {voters.length - 6} weitere Stimmen
                        <div 
                          className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45"
                          style={{
                            background: 'hsl(var(--poll-glass-bg))',
                            border: '1px solid hsl(var(--poll-border))',
                            borderTop: 'none',
                            borderLeft: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Elegant Vote Count Footer */}
        <div 
          className="text-sm text-white/70 text-center mt-6 pt-4 relative"
          style={{
            borderTop: '1px solid hsl(var(--poll-border))'
          }}
        >
          <div 
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm"
            style={{
              background: 'hsl(var(--poll-option-bg))',
              border: '1px solid hsl(var(--poll-border))'
            }}
          >
            <BarChart3 className="h-4 w-4 text-white/80" />
            {totalVotes === 0 ? (
              <span className="font-medium">Noch keine Stimmen abgegeben</span>
            ) : totalVotes === 1 ? (
              <span className="font-medium">1 Person hat abgestimmt</span>
            ) : (
              <span className="font-medium">{totalVotes} Personen haben abgestimmt</span>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PollMessage;