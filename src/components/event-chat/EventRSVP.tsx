import React, { useState, useEffect } from 'react';
import { Check, HelpCircle, X, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { USERNAME_KEY, AVATAR_KEY } from '@/types/chatTypes';

export interface EventRSVPData {
  eventId: string;
  rsvpYes: number;
  rsvpNo: number;
  rsvpMaybe: number;
  userVotes?: {
    yes: { username: string; avatar?: string }[];
    no: { username: string; avatar?: string }[];
    maybe: { username: string; avatar?: string }[];
  };
}

interface EventRSVPProps {
  eventId: string;
  currentUsername: string;
  initialData?: EventRSVPData;
  onVoteChange?: (eventId: string, data: EventRSVPData) => void;
}

export const EventRSVP: React.FC<EventRSVPProps> = ({
  eventId,
  currentUsername,
  initialData,
  onVoteChange
}) => {
  const [rsvpData, setRsvpData] = useState<EventRSVPData>(
    initialData || {
      eventId,
      rsvpYes: 0,
      rsvpNo: 0,
      rsvpMaybe: 0,
      userVotes: { yes: [], no: [], maybe: [] }
    }
  );
  const [userVote, setUserVote] = useState<'yes' | 'no' | 'maybe' | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize user vote based on stored data
  useEffect(() => {
    if (rsvpData.userVotes) {
      if (rsvpData.userVotes.yes.some(v => v.username === currentUsername)) {
        setUserVote('yes');
      } else if (rsvpData.userVotes.no.some(v => v.username === currentUsername)) {
        setUserVote('no');
      } else if (rsvpData.userVotes.maybe.some(v => v.username === currentUsername)) {
        setUserVote('maybe');
      }
    }
  }, [rsvpData.userVotes, currentUsername]);

  // Load RSVP data from database
  useEffect(() => {
    loadRSVPData();
  }, [eventId]);

  const loadRSVPData = async () => {
    try {
      const { data: event, error } = await supabase
        .from('community_events')
        .select('id, rsvp_yes, rsvp_no, rsvp_maybe, liked_by_users')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Error loading RSVP data:', error);
        return;
      }

      if (event) {
        // Convert liked_by_users to userVotes format for RSVP
        const likedUsers = event.liked_by_users as any[] || [];
        const newRsvpData: EventRSVPData = {
          eventId,
          rsvpYes: event.rsvp_yes || 0,
          rsvpNo: event.rsvp_no || 0,
          rsvpMaybe: event.rsvp_maybe || 0,
          userVotes: {
            yes: likedUsers.filter(u => u.vote === 'yes'),
            no: likedUsers.filter(u => u.vote === 'no'),
            maybe: likedUsers.filter(u => u.vote === 'maybe')
          }
        };
        setRsvpData(newRsvpData);
      }
    } catch (error) {
      console.error('Error loading RSVP data:', error);
    }
  };

  const handleVote = async (option: 'yes' | 'no' | 'maybe') => {
    if (loading) return;
    
    setLoading(true);
    const username = localStorage.getItem(USERNAME_KEY) || 'Gast';
    const avatar = localStorage.getItem(AVATAR_KEY);
    
    try {
      // Get current event data
      const { data: currentEvent, error: fetchError } = await supabase
        .from('community_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (fetchError) throw fetchError;

      const currentLikedUsers = (currentEvent.liked_by_users as any[]) || [];
      
      // Remove user's previous vote
      const filteredUsers = currentLikedUsers.filter(u => u.username !== username);
      
      // Add new vote
      const newUser = { username, avatar, vote: option, timestamp: new Date().toISOString() };
      const updatedLikedUsers = [...filteredUsers, newUser];
      
      // Count votes
      const yesCounts = updatedLikedUsers.filter(u => u.vote === 'yes').length;
      const noCounts = updatedLikedUsers.filter(u => u.vote === 'no').length;
      const maybeCounts = updatedLikedUsers.filter(u => u.vote === 'maybe').length;
      
      // Update database
      const { error: updateError } = await supabase
        .from('community_events')
        .update({
          liked_by_users: updatedLikedUsers,
          rsvp_yes: yesCounts,
          rsvp_no: noCounts,
          rsvp_maybe: maybeCounts
        })
        .eq('id', eventId);

      if (updateError) throw updateError;

      // Update local state
      const newRsvpData: EventRSVPData = {
        eventId,
        rsvpYes: yesCounts,
        rsvpNo: noCounts,
        rsvpMaybe: maybeCounts,
        userVotes: {
          yes: updatedLikedUsers.filter(u => u.vote === 'yes'),
          no: updatedLikedUsers.filter(u => u.vote === 'no'),
          maybe: updatedLikedUsers.filter(u => u.vote === 'maybe')
        }
      };

      setRsvpData(newRsvpData);
      setUserVote(option);
      
      if (onVoteChange) {
        onVoteChange(eventId, newRsvpData);
      }

    } catch (error) {
      console.error('Error voting on event RSVP:', error);
      toast.error('Fehler beim Abstimmen');
    } finally {
      setLoading(false);
    }
  };

  const renderVoteButton = (option: 'yes' | 'no' | 'maybe', count: number, icon: React.ReactNode, label: string, bgColor: string) => {
    const isSelected = userVote === option;
    const users = rsvpData.userVotes?.[option] || [];

    return (
      <div className="flex flex-col items-center">
        <Button
          variant={isSelected ? "default" : "outline"}
          size="sm"
          onClick={() => handleVote(option)}
          disabled={loading}
          className={`
            h-auto py-2 px-3 flex flex-col items-center gap-1 min-w-[60px] transition-all duration-300
            ${isSelected 
              ? `${bgColor} text-white shadow-lg transform scale-105` 
              : 'bg-card/30 border-border/50 hover:bg-card/50 text-muted-foreground hover:text-foreground backdrop-blur-sm'
            }
          `}
        >
          {icon}
          <span className="text-xs font-medium">{label}</span>
          <span className="text-xs font-bold">{count}</span>
        </Button>
        
        {users.length > 0 && (
          <div className="flex -space-x-1 mt-1">
            {users.slice(0, 3).map((user, index) => (
              <div
                key={index}
                className="w-5 h-5 rounded-full border border-white bg-muted flex items-center justify-center text-xs overflow-hidden"
                title={user.username}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-foreground font-medium">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            ))}
            {users.length > 3 && (
              <div className="w-5 h-5 rounded-full border border-white bg-muted flex items-center justify-center text-xs">
                <span className="text-foreground text-[8px]">+{users.length - 3}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const totalVotes = rsvpData.rsvpYes + rsvpData.rsvpNo + rsvpData.rsvpMaybe;

  return (
    <div className="mt-3 p-3 rounded-lg bg-card/20 border border-border/30 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">RSVP</span>
        {totalVotes > 0 && (
          <span className="text-xs text-muted-foreground">
            • {totalVotes} {totalVotes === 1 ? 'Antwort' : 'Antworten'}
          </span>
        )}
      </div>
      
      <div className="flex justify-center gap-4">
        {renderVoteButton(
          'yes', 
          rsvpData.rsvpYes, 
          <CheckCircle className="h-4 w-4" />, 
          'Ja', 
          'bg-green-600 hover:bg-green-700'
        )}
        {renderVoteButton(
          'maybe', 
          rsvpData.rsvpMaybe, 
          <HelpCircle className="h-4 w-4" />, 
          'Vielleicht', 
          'bg-yellow-600 hover:bg-yellow-700'
        )}
        {renderVoteButton(
          'no', 
          rsvpData.rsvpNo, 
          <XCircle className="h-4 w-4" />, 
          'Nein', 
          'bg-red-600 hover:bg-red-700'
        )}
      </div>
    </div>
  );
};

export default EventRSVP;