import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/chatUIUtils';
import { supabase } from '@/integrations/supabase/client';
import { AVATAR_KEY, USERNAME_KEY } from '@/types/chatTypes';
import { toast } from 'sonner';
import { updateEventLikes } from '@/services/eventService';

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
  sender?: string;
  senderAvatar?: string;
}

const MeetupProposal: React.FC<MeetupProposalProps> = ({
  messageId,
  eventId,
  eventTitle,
  eventDate,
  eventLocation,
  messageText,
  meetupResponses = {},
  onShowEvent,
  sender,
  senderAvatar
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

      // Determine if we're adding or removing the response
      const isAddingResponse = userResponse !== response;
      const isClickingBinDabei = response === 'bin dabei';
      
      // Add to selected response if not clicking same button
      if (isAddingResponse) {
        if (!newResponses[response]) {
          newResponses[response] = [];
        }
        newResponses[response].push({ username, avatar });
      }

      // Sync with event likes for "bin dabei"
      if (isClickingBinDabei) {
        try {
          if (isAddingResponse) {
            // Like the event when clicking "bin dabei"
            await updateEventLikes(eventId, 'like', { 
              username: username, 
              avatar_url: avatar 
            });
          } else {
            // Unlike the event when removing "bin dabei"
            await updateEventLikes(eventId, 'unlike', { 
              username: username, 
              avatar_url: avatar 
            });
          }
        } catch (likeError) {
          console.error('Error syncing event likes:', likeError);
          // Don't fail the entire operation if like sync fails
        }
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
    <div className="my-4 rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-background via-background/95 to-muted/50 backdrop-blur-sm shadow-2xl shadow-primary/10">
      {/* Header with Avatar */}
      <div className="px-5 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
        <div className="flex items-center gap-3 mb-3">
          {sender && (
            <Avatar className="w-8 h-8 ring-2 ring-primary/30 shadow-lg">
              <AvatarImage src={senderAvatar || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {getInitials(sender)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex items-center gap-2 flex-1">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">Meetup-Vorschlag</span>
            {sender && <span className="text-xs text-muted-foreground">von {sender}</span>}
          </div>
        </div>
        <h3 className="text-lg font-bold text-foreground leading-tight">{eventTitle}</h3>
      </div>

      {/* Event Details */}
      {(eventDate || eventLocation) && (
        <div className="px-5 py-4 space-y-3 border-b border-border/30 bg-muted/30">
          {eventDate && (
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">{new Date(eventDate).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          )}
          {eventLocation && (
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">{eventLocation}</span>
            </div>
          )}
        </div>
      )}

      {/* Message Text */}
      <div className="px-5 py-4 text-sm text-foreground/90 whitespace-pre-wrap border-b border-border/30 leading-relaxed bg-background/50">
        {messageText.replace(/^#\w+\s+🎉\s+Meetup-Vorschlag für ".*"!\n\n/, '').replace(/\n\nWer ist dabei\? Antwortet hier im Chat! 💬$/, '')}
      </div>

      {/* Action Buttons */}
      <div className="px-5 py-4 space-y-3 bg-background/30">
        {/* Show Event Button */}
        <Button
          onClick={handleShowEvent}
          variant="outline"
          size="sm"
          className="w-full h-10 bg-primary/5 hover:bg-primary/10 border-primary/20 text-foreground hover:text-foreground transition-all duration-300 font-medium shadow-sm hover:shadow-md"
        >
          <Sparkles className="w-4 h-4 mr-2 text-primary" />
          Event mit MIA anzeigen
        </Button>

        {/* Response Chips */}
        <div className="flex gap-3">
          <Button
            onClick={() => handleResponse('bin dabei')}
            variant="outline"
            size="sm"
            className={`flex-1 h-11 transition-all duration-300 font-medium shadow-sm ${
              userResponse === 'bin dabei'
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-green-500/50 text-white shadow-lg shadow-green-500/30 scale-105'
                : 'bg-background hover:bg-muted border-border text-foreground/80 hover:text-foreground hover:border-primary/30'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Bin dabei
            {binDabeiCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">({binDabeiCount})</span>}
          </Button>
          
          <Button
            onClick={() => handleResponse('diesmal nicht')}
            variant="outline"
            size="sm"
            className={`flex-1 h-11 transition-all duration-300 font-medium shadow-sm ${
              userResponse === 'diesmal nicht'
                ? 'bg-gradient-to-r from-muted to-muted-foreground/20 hover:from-muted hover:to-muted-foreground/30 border-muted-foreground/30 text-foreground shadow-lg shadow-muted/30 scale-105'
                : 'bg-background hover:bg-muted border-border text-foreground/80 hover:text-foreground hover:border-primary/30'
            }`}
          >
            Diesmal nicht
            {diesmalNichtCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-black/10 rounded-full text-xs font-bold">({diesmalNichtCount})</span>}
          </Button>
        </div>

        {/* Avatar Display for "bin dabei" */}
        {binDabeiCount > 0 && (
          <div className="flex items-center gap-3 pt-3 border-t border-border/30">
            <div className="flex items-center -space-x-3">
              {responses['bin dabei']?.slice(0, 5).map((user, index) => (
                <Avatar 
                  key={`${user.username}-${index}`}
                  className="w-8 h-8 border-2 border-background ring-2 ring-green-500/30 shadow-md"
                  style={{ zIndex: 5 - index }}
                >
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-green-600 to-green-700 text-white text-xs font-semibold">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {binDabeiCount > 5 && (
                <div 
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-green-700 to-green-800 border-2 border-background ring-2 ring-green-500/30 flex items-center justify-center text-white text-xs font-bold shadow-md"
                  style={{ zIndex: 0 }}
                >
                  +{binDabeiCount - 5}
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground font-medium">
              {binDabeiCount === 1 ? '1 Person' : `${binDabeiCount} Personen`} dabei
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetupProposal;
