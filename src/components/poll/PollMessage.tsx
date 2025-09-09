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
        "group px-4 py-3 rounded-2xl relative w-full max-w-full overflow-hidden text-white",
        isConsecutive ? "mt-1" : "mt-2"
      )}
      style={{ 
        background: 'linear-gradient(135deg, hsl(var(--poll-glass-bg)), hsl(var(--poll-glass-bg) / 0.6))',
        border: '1px solid hsl(var(--poll-border))',
        borderTop: '2px solid hsl(var(--poll-accent))',
        borderRadius: '16px',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 16px hsl(var(--poll-shadow) / 0.2)'
      }}
    >
      <div className="flex flex-col relative z-10">
        {/* Poll Header */}
        <div className="flex items-start gap-3 mb-3">
          <div 
            className="p-2 rounded-xl flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--poll-gradient-start) / 0.2), hsl(var(--poll-gradient-end) / 0.2))',
              backdropFilter: 'blur(10px)',
              border: '1px solid hsl(var(--poll-border))'
            }}
          >
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white break-words leading-relaxed">
              {pollData.question}
            </p>
          </div>
        </div>
        
        {/* Poll Options */}
        <div className="space-y-2">
        {safeOptions.map((option, index) => {
          const percentage = getOptionPercentage(index);
          const optionVotes = getOptionVotes(index);
          const voters = getOptionVoters(index);
          const isSelected = userVote === index;
          const hasVoted = userVote !== null;
          
          return (
            <div key={index} className="space-y-2">
              <div className="relative">
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-left relative overflow-hidden h-10 rounded-xl ${
                    hasVoted ? 'cursor-default' : 'cursor-pointer hover:scale-[1.01]'
                  }`}
                  style={{
                    background: isSelected 
                      ? `linear-gradient(135deg, hsl(var(--poll-gradient-start) / 0.3), hsl(var(--poll-gradient-end) / 0.3))`
                      : 'hsl(var(--poll-option-bg))',
                    border: isSelected 
                      ? '1px solid hsl(var(--poll-accent))' 
                      : '1px solid hsl(var(--poll-border))',
                    backdropFilter: 'blur(10px)',
                    boxShadow: isSelected 
                      ? '0 4px 12px hsl(var(--poll-shadow))' 
                      : 'none'
                  }}
                  onClick={() => handleVote(index)}
                  disabled={hasVoted || loading}
                >
                  {/* Option letter */}
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/80 z-20">
                    {String.fromCharCode(65 + index)}
                  </div>
                  
                  <div className="flex items-center justify-between w-full z-10 relative pl-10 pr-2">
                    <span className="text-sm font-medium flex-1 mr-2 text-white/95">
                      {option}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      )}
                      {hasVoted && (
                        <div 
                          className="text-xs font-semibold text-white/95 px-2 py-1 rounded-lg backdrop-blur-sm"
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
                  
                  {/* Progress bar */}
                  {hasVoted && (
                    <div 
                      className="absolute inset-0 rounded-xl opacity-20"
                      style={{ 
                        background: `linear-gradient(90deg, hsl(var(--poll-gradient-start) / 0.4) 0%, hsl(var(--poll-gradient-end) / 0.3) 100%)`,
                        width: `${percentage}%`
                      }}
                    />
                  )}
                </Button>
              </div>
              
              {/* Voter avatars */}
              {voters.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-10">
                  {voters.slice(0, 4).map((voter, voterIndex) => (
                    <div key={`${voter.username}-${voterIndex}`} className="group/avatar relative">
                      <Avatar 
                        className="h-6 w-6 border"
                        style={{
                          borderColor: 'hsl(var(--poll-accent) / 0.6)'
                        }}
                      >
                        <AvatarImage src={voter.avatar || undefined} alt={voter.username} />
                        <AvatarFallback 
                          className="text-white text-xs font-semibold"
                          style={{
                            background: 'linear-gradient(135deg, hsl(var(--poll-gradient-start)), hsl(var(--poll-gradient-end)))'
                          }}
                        >
                          {getInitials(voter.username)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ))}
                  {voters.length > 4 && (
                    <div 
                      className="h-6 w-6 rounded-full flex items-center justify-center text-xs text-white font-semibold"
                      style={{
                        background: 'hsl(var(--poll-option-bg))',
                        border: '1px solid hsl(var(--poll-accent) / 0.6)'
                      }}
                    >
                      +{voters.length - 4}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Vote Count Footer */}
        <div 
          className="text-xs text-white/70 text-center mt-3 pt-2"
          style={{
            borderTop: '1px solid hsl(var(--poll-border))'
          }}
        >
          <div className="flex items-center justify-center gap-1">
            <BarChart3 className="h-3 w-3 text-white/60" />
            {totalVotes === 0 ? (
              <span>Noch keine Stimmen</span>
            ) : totalVotes === 1 ? (
              <span>1 Stimme</span>
            ) : (
              <span>{totalVotes} Stimmen</span>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PollMessage;