import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, BarChart3 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';
import { getInitials } from '@/utils/chatUIUtils';

interface PollData {
  question: string;
  options: string[];
  votes?: { [optionIndex: number]: { username: string; avatar?: string }[] }; // option index -> array of user objects
}

interface PollMessageProps {
  pollData: PollData;
  messageId: string;
  onVote?: (optionIndex: number, messageId: string) => void;
}

const PollMessage: React.FC<PollMessageProps> = ({
  pollData,
  messageId,
  onVote
}) => {
  console.log('PollMessage: Received pollData:', pollData);
  
  // Defensive check - ensure options is an array
  const safeOptions = Array.isArray(pollData.options) ? pollData.options : [];
  
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
    <Card className="w-full max-w-md bg-gray-900/95 backdrop-blur-sm border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <BarChart3 className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white break-words">
              {pollData.question}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {safeOptions.map((option, index) => {
          const percentage = getOptionPercentage(index);
          const optionVotes = getOptionVotes(index);
          const voters = getOptionVoters(index);
          const isSelected = userVote === index;
          
          return (
            <div key={index} className="space-y-2">
              <Button
                variant={isSelected ? "default" : "outline"}
                className={`w-full justify-start text-left relative overflow-hidden bg-gray-800 border-gray-600 hover:bg-gray-700 ${
                  userVote !== null ? 'cursor-default' : 'cursor-pointer'
                } ${isSelected ? 'bg-blue-600 hover:bg-blue-600' : ''}`}
                onClick={() => handleVote(index)}
                disabled={userVote !== null || loading}
              >
                <div className="flex items-center justify-between w-full z-10 relative">
                  <span className="text-sm truncate flex-1 mr-2 text-white">{option}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                    {userVote !== null && (
                      <span className="text-xs font-medium text-white">
                        {optionVotes} ({percentage}%)
                      </span>
                    )}
                  </div>
                </div>
                {userVote !== null && (
                  <div 
                    className="absolute inset-0 bg-blue-500/30 transition-all duration-300 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                )}
              </Button>
              
              {/* Show avatars of voters for this option - WhatsApp style */}
              {voters.length > 0 && (
                <div className="flex flex-wrap gap-1 ml-2 mt-1">
                  {voters.slice(0, 6).map((voter, voterIndex) => (
                    <Avatar key={`${voter.username}-${voterIndex}`} className="h-6 w-6 border border-gray-600">
                      <AvatarImage src={voter.avatar || undefined} alt={voter.username} />
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {getInitials(voter.username)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {voters.length > 6 && (
                    <div className="h-6 w-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                      <span className="text-xs text-gray-300">+{voters.length - 6}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        <div className="text-xs text-gray-400 text-center mt-3">
          {totalVotes === 0 ? (
            "Noch keine Stimmen"
          ) : totalVotes === 1 ? (
            "1 Stimme"
          ) : (
            `${totalVotes} Stimmen`
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PollMessage;