import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { USERNAME_KEY } from '@/types/chatTypes';

interface PollData {
  question: string;
  options: string[];
  votes?: { [optionIndex: number]: string[] }; // option index -> array of usernames
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
  const [votes, setVotes] = useState<{ [optionIndex: number]: string[] }>(pollData.votes || {});
  const [userVote, setUserVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  const currentUser = localStorage.getItem(USERNAME_KEY) || 'Gast';

  useEffect(() => {
    // Check if current user has already voted
    for (let optionIndex in votes) {
      if (votes[optionIndex].includes(currentUser)) {
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
      newVotes[optionIndex] = [...newVotes[optionIndex], currentUser];
      
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

  const totalVotes = getTotalVotes();

  return (
    <Card className="w-full max-w-md bg-background/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <BarChart3 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground break-words">
              {pollData.question}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {pollData.options.map((option, index) => {
          const percentage = getOptionPercentage(index);
          const optionVotes = getOptionVotes(index);
          const isSelected = userVote === index;
          
          return (
            <div key={index} className="space-y-1">
              <Button
                variant={isSelected ? "default" : "outline"}
                className={`w-full justify-start text-left relative overflow-hidden ${
                  userVote !== null ? 'cursor-default' : 'cursor-pointer'
                }`}
                onClick={() => handleVote(index)}
                disabled={userVote !== null || loading}
              >
                <div className="flex items-center justify-between w-full z-10 relative">
                  <span className="text-sm truncate flex-1 mr-2">{option}</span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isSelected && <CheckCircle2 className="h-4 w-4" />}
                    {userVote !== null && (
                      <span className="text-xs font-medium">
                        {optionVotes} ({percentage}%)
                      </span>
                    )}
                  </div>
                </div>
                {userVote !== null && (
                  <div 
                    className="absolute inset-0 bg-primary/20 transition-all duration-300 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                )}
              </Button>
            </div>
          );
        })}
        
        <div className="text-xs text-muted-foreground text-center mt-3">
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