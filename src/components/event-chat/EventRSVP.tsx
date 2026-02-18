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

  const renderRow = (
    option: 'yes' | 'no' | 'maybe',
    label: string,
    icon: React.ReactNode,
    activeClass: string,
    activeTextClass: string,
    activeRingClass: string,
    activeNameClass: string,
  ) => {
    const isSelected = userVote === option;
    const users = rsvpData.userVotes?.[option] || [];
    const count = option === 'yes' ? rsvpData.rsvpYes : option === 'no' ? rsvpData.rsvpNo : rsvpData.rsvpMaybe;

    return (
      <button
        onClick={() => handleVote(option)}
        disabled={loading}
        className={`w-full flex items-center gap-2 text-left px-3 py-2 rounded-lg transition-all ${
          isSelected ? activeClass : 'bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
        }`}
      >
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
          isSelected ? activeTextClass : 'bg-white/10 text-zinc-400'
        }`}>
          {icon}
        </div>
        <span className={`text-[10px] font-medium flex-shrink-0 ${isSelected ? activeNameClass : 'text-zinc-400'}`}>
          {label}
        </span>
        {users.length > 0 && (
          <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
            <div className="flex -space-x-1.5 flex-shrink-0">
              {users.slice(0, 5).map((u, i) => (
                <div key={i} className={`w-5 h-5 rounded-full border-2 border-black bg-zinc-800 overflow-hidden ring-1 ${activeRingClass}`}>
                  {u.avatar ? (
                    <img src={u.avatar} className="w-full h-full object-cover" alt={u.username} />
                  ) : (
                    <span className={`text-[7px] flex items-center justify-center h-full font-bold ${activeNameClass}`}>{u.username[0]}</span>
                  )}
                </div>
              ))}
            </div>
            <span className={`text-[9px] truncate ${activeNameClass} opacity-80`}>
              {users.map(u => u.username).join(', ')}
            </span>
          </div>
        )}
        {users.length === 0 && count > 0 && (
          <span className={`text-[9px] ${activeNameClass} opacity-60`}>{count}</span>
        )}
      </button>
    );
  };

  const totalVotes = rsvpData.rsvpYes + rsvpData.rsvpNo + rsvpData.rsvpMaybe;

  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center gap-2 mb-2">
        <Users className="h-3 w-3 text-zinc-500" />
        <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">RSVP</span>
        {totalVotes > 0 && (
          <span className="text-[9px] text-zinc-600">• {totalVotes} {totalVotes === 1 ? 'Antwort' : 'Antworten'}</span>
        )}
      </div>
      {renderRow('yes', 'Dabei', <Check size={12} />, 'bg-green-500/15 border border-green-500/30', 'bg-green-500 text-black', 'ring-green-500/50', 'text-green-400')}
      {renderRow('maybe', 'Vielleicht', <HelpCircle size={12} />, 'bg-yellow-500/15 border border-yellow-500/30', 'bg-yellow-500 text-black', 'ring-yellow-500/40', 'text-yellow-400')}
      {renderRow('no', 'Diesmal nicht', <X size={12} />, 'bg-zinc-800/50 border border-zinc-700', 'bg-zinc-600 text-zinc-300', 'ring-zinc-600/50', 'text-zinc-400')}
    </div>
  );
};

export default EventRSVP;