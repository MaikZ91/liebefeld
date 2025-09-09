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
    <div className={cn(
      "group pl-2 pr-4 py-3 rounded-2xl relative w-full max-w-full overflow-hidden transition-all duration-200 text-white",
      isConsecutive ? "mt-1" : "mt-2"
    )}
         style={{ 
           background: 'rgba(0, 0, 0, 0.8)',
           border: `1px solid rgba(255, 255, 255, 0.1)`,
           borderTop: `0.5px solid #3690FF`,
           borderRadius: '16px'
         }}>
      <div className="flex flex-col relative z-10">
        {/* Poll Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-blue-500/20 backdrop-blur-sm">
            <BarChart3 className="h-5 w-5 text-blue-400 flex-shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white break-words leading-relaxed">
              {pollData.question}
            </p>
          </div>
        </div>
        
        {/* Poll Options */}
        <div className="space-y-3">
        {safeOptions.map((option, index) => {
          const percentage = getOptionPercentage(index);
          const optionVotes = getOptionVotes(index);
          const voters = getOptionVoters(index);
          const isSelected = userVote === index;
          const hasVoted = userVote !== null;
          
          return (
            <div key={index} className="space-y-2">
              <div className="relative group">
                <Button
                  variant={isSelected ? "default" : "outline"}
                  className={`w-full justify-start text-left relative overflow-hidden transition-all duration-300 ${
                    hasVoted ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02] hover:shadow-lg'
                  } ${
                    isSelected 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-600 hover:to-blue-500 border-blue-500 shadow-blue-500/25 shadow-lg' 
                      : 'bg-gray-800/80 border-gray-600/60 hover:bg-gray-700/90 hover:border-gray-500/70'
                  }`}
                  onClick={() => handleVote(index)}
                  disabled={hasVoted || loading}
                >
                  <div className="flex items-center justify-between w-full z-10 relative">
                    <span className="text-sm truncate flex-1 mr-2 text-white font-medium">
                      {option}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-white animate-scale-in" />
                      )}
                      {hasVoted && (
                        <span className="text-xs font-semibold text-white/90 bg-black/20 px-2 py-1 rounded-full">
                          {optionVotes} ({percentage}%)
                        </span>
                      )}
                    </div>
                  </div>
                  {hasVoted && (
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-blue-400/20 transition-all duration-500 ease-out rounded-md"
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                </Button>
              </div>
              
              {/* Show avatars of voters for this option - WhatsApp style */}
              {voters.length > 0 && (
                <div className="flex flex-wrap gap-1.5 ml-3 animate-fade-in">
                  {voters.slice(0, 6).map((voter, voterIndex) => (
                    <div key={`${voter.username}-${voterIndex}`} className="group/avatar relative">
                      <Avatar className="h-7 w-7 border-2 border-gray-600/80 transition-all duration-200 hover:scale-110 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-400/20">
                        <AvatarImage src={voter.avatar || undefined} alt={voter.username} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-500 text-white text-xs font-semibold">
                          {getInitials(voter.username)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                        {voter.username}
                      </div>
                    </div>
                  ))}
                  {voters.length > 6 && (
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 border-2 border-gray-600/80 flex items-center justify-center group/more hover:scale-110 transition-transform duration-200">
                      <span className="text-xs text-gray-300 font-semibold">+{voters.length - 6}</span>
                      {/* Tooltip for overflow count */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/more:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                        {voters.length - 6} weitere
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Vote Count */}
        <div className="text-xs text-gray-400 text-center mt-4 pt-3 border-t border-gray-700/50">
          {totalVotes === 0 ? (
            <span className="flex items-center justify-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Noch keine Stimmen
            </span>
          ) : totalVotes === 1 ? (
            <span className="flex items-center justify-center gap-1">
              <BarChart3 className="h-3 w-3" />
              1 Stimme
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {totalVotes} Stimmen
            </span>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default PollMessage;