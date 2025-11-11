import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils';
import { supabase } from '@/integrations/supabase/client';
import { AVATAR_KEY, USERNAME_KEY } from '@/types/chatTypes';
import { toast } from 'sonner';

interface MeetupProposalProps {
  messageId: string;
  eventId: string;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  messageText: string;
  meetupResponses?: {
    'bin dabei'?: Array<{ username: string; avatar?: string }>;
    'diesmal nicht'?: Array<{ username: string; avatar?: string }>;
  };
  onShowEvent?: (eventId: string) => void;
}

const MeetupProposal: React.FC<MeetupProposalProps> = ({
  messageId,
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  messageText,
  meetupResponses = {},
  onShowEvent
}) => {
  const [responses, setResponses] = useState(meetupResponses);
  const [userResponse, setUserResponse] = useState<'bin dabei' | 'diesmal nicht' | null>(null);
  const username = localStorage.getItem(USERNAME_KEY) || 'Gast';
  const avatar = localStorage.getItem(AVATAR_KEY) || '';

  // Check if current user has already responded
  useEffect(() => {
    const checkUserResponse = () => {
      if (responses['bin dabei']?.some(r => r.username === username)) {
        setUserResponse('bin dabei');
      } else if (responses['diesmal nicht']?.some(r => r.username === username)) {
        setUserResponse('diesmal nicht');
      } else {
        setUserResponse(null);
      }
    };
    checkUserResponse();
  }, [responses, username]);

  const handleResponse = async (response: 'bin dabei' | 'diesmal nicht') => {
    try {
      // Create new responses object
      const newResponses = { ...responses };
      
      // Remove user from both categories first
      if (newResponses['bin dabei']) {
        newResponses['bin dabei'] = newResponses['bin dabei'].filter(r => r.username !== username);
      }
      if (newResponses['diesmal nicht']) {
        newResponses['diesmal nicht'] = newResponses['diesmal nicht'].filter(r => r.username !== username);
      }

      // Add to selected response if not clicking same button
      if (userResponse !== response) {
        if (!newResponses[response]) {
          newResponses[response] = [];
        }
        newResponses[response].push({ username, avatar });
      }

      // Update database
      const { error } = await supabase
        .from('chat_messages')
        .update({ meetup_responses: newResponses })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setResponses(newResponses);
      toast.success(userResponse === response ? 'Antwort entfernt' : 'Antwort gespeichert');
    } catch (error) {
      console.error('Error updating meetup response:', error);
      toast.error('Fehler beim Speichern der Antwort');
    }
  };

  const handleShowEvent = () => {
    if (onShowEvent) {
      onShowEvent(eventId);
    }
  };

  const binDabeiCount = responses['bin dabei']?.length || 0;
  const diesmalNichtCount = responses['diesmal nicht']?.length || 0;

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-red-500/30 bg-gradient-to-br from-red-950/40 via-black/50 to-gray-900/50 backdrop-blur-sm shadow-lg shadow-red-500/20">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-red-600/20 to-red-700/20 border-b border-red-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-red-300">Meetup-Vorschlag</span>
        </div>
        <h3 className="text-base font-bold text-white">{eventTitle}</h3>
      </div>

      {/* Event Details */}
      {(eventDate || eventLocation) && (
        <div className="px-4 py-3 space-y-2 border-b border-white/5">
          {eventDate && (
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Calendar className="w-4 h-4 text-red-400" />
              <span>{new Date(eventDate).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          )}
          {eventLocation && (
            <div className="flex items-center gap-2 text-sm text-white/80">
              <MapPin className="w-4 h-4 text-red-400" />
              <span>{eventLocation}</span>
            </div>
          )}
        </div>
      )}

      {/* Message Text */}
      <div className="px-4 py-3 text-sm text-white/90 whitespace-pre-wrap border-b border-white/5">
        {messageText.replace(/^#\w+\s+🎉\s+Meetup-Vorschlag für ".*"!\n\n/, '').replace(/\n\nWer ist dabei\? Antwortet hier im Chat! 💬$/, '')}
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 space-y-3">
        {/* Show Event Button */}
        <Button
          onClick={handleShowEvent}
          variant="outline"
          size="sm"
          className="w-full h-9 bg-white/5 hover:bg-white/10 border-white/20 text-white hover:text-white transition-all duration-200"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Event mit MIA anzeigen
        </Button>

        {/* Response Chips */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleResponse('bin dabei')}
            variant="outline"
            size="sm"
            className={`flex-1 h-10 transition-all duration-200 ${
              userResponse === 'bin dabei'
                ? 'bg-green-600 hover:bg-green-700 border-green-500 text-white shadow-lg shadow-green-500/30'
                : 'bg-white/5 hover:bg-white/10 border-white/20 text-white/80 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Bin dabei
            {binDabeiCount > 0 && <span className="ml-2 font-bold">({binDabeiCount})</span>}
          </Button>
          
          <Button
            onClick={() => handleResponse('diesmal nicht')}
            variant="outline"
            size="sm"
            className={`flex-1 h-10 transition-all duration-200 ${
              userResponse === 'diesmal nicht'
                ? 'bg-gray-600 hover:bg-gray-700 border-gray-500 text-white shadow-lg shadow-gray-500/30'
                : 'bg-white/5 hover:bg-white/10 border-white/20 text-white/80 hover:text-white'
            }`}
          >
            Diesmal nicht
            {diesmalNichtCount > 0 && <span className="ml-2 font-bold">({diesmalNichtCount})</span>}
          </Button>
        </div>

        {/* Avatar Display for "bin dabei" */}
        {binDabeiCount > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <div className="flex items-center -space-x-2">
              {responses['bin dabei']?.slice(0, 5).map((user, index) => (
                <Avatar 
                  key={`${user.username}-${index}`}
                  className="w-6 h-6 border-2 border-black"
                  style={{ zIndex: 5 - index }}
                >
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-green-600 text-white text-[10px]">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {binDabeiCount > 5 && (
                <div 
                  className="w-6 h-6 rounded-full bg-green-700 border-2 border-black flex items-center justify-center text-white text-[10px] font-medium"
                  style={{ zIndex: 0 }}
                >
                  +{binDabeiCount - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-white/60">
              {binDabeiCount === 1 ? '1 Person' : `${binDabeiCount} Personen`} dabei
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetupProposal;
