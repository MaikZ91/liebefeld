import React, { useState, useEffect } from 'react';
import { type Event, RsvpOption, normalizeRsvpCounts } from '../types/eventTypes';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Heart, Check, X, HelpCircle, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useEventContext } from '@/contexts/EventContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface EventDetailsProps {
  event: Event;
  onClose: () => void;
  onRsvp?: (option: RsvpOption) => void;
  onJoinChat?: (eventId: string, eventTitle: string) => void;
}

const categoryColors: Record<string, string> = {
  'Networking': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Workshop': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Sport': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Kultur': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'Meeting': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  'Party': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  'Vortrag': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  'Konzert': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'Ausstellung': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
};

const EventDetails: React.FC<EventDetailsProps> = ({ event, onClose, onRsvp, onJoinChat }) => {
  const { handleLikeEvent } = useEventContext();
  const [isOpen, setIsOpen] = useState(true);
  const [showSparkle, setShowSparkle] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [fetchedDescription, setFetchedDescription] = useState<string | null>(null);
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);
  const [descriptionSource, setDescriptionSource] = useState<'scraped' | 'generated' | 'original'>('original');
  
  // Get the correct likes count directly from the event
  const displayLikes = event.likes || 0;

  // Fetch description if needed
  useEffect(() => {
    const fetchDescription = async () => {
      // Check if we need to fetch a description
      if (event.description && event.description.length > 20) {
        setDescriptionSource('original');
        return;
      }

      // Check cache first
      const cacheKey = `event-description-${event.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { description, source } = JSON.parse(cached);
          setFetchedDescription(description);
          setDescriptionSource(source);
          return;
        } catch (e) {
          // Invalid cache, continue
        }
      }

      setIsLoadingDescription(true);
      try {
        const { data, error } = await supabase.functions.invoke('fetch-event-description', {
          body: {
            eventLink: event.link,
            eventData: {
              title: event.title,
              category: event.category,
              location: event.location,
              organizer: event.organizer
            }
          }
        });

        if (error) throw error;

        if (data?.description) {
          setFetchedDescription(data.description);
          setDescriptionSource(data.source || 'generated');
          
          // Cache the result
          sessionStorage.setItem(cacheKey, JSON.stringify({
            description: data.description,
            source: data.source
          }));
        }
      } catch (error) {
        console.error('Failed to fetch description:', error);
        // Use fallback
        setFetchedDescription(`${event.category}-Event in ${event.location}. Sei dabei!`);
        setDescriptionSource('generated');
      } finally {
        setIsLoadingDescription(false);
      }
    };

    fetchDescription();
  }, [event.id, event.description, event.link, event.title, event.category, event.location, event.organizer]);
  
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Allow animation to complete
  };

  const handleLike = async () => {
    if (isLiking) return;

    setIsLiking(true);
    setShowSparkle(true);
    
    await handleLikeEvent(event.id);

    setTimeout(() => setShowSparkle(false), 1000);
    setIsLiking(false);
  };
  
  const handleRsvp = (option: RsvpOption) => {
    if (onRsvp) {
      console.log(`RSVP ${option} for event ${event.id}`);
      onRsvp(option);
    }
  };
  
  // Format the date for display
  const formattedDate = format(parseISO(event.date), 'EEEE, d. MMMM yyyy', { locale: de });
  
  // Normalize RSVP counts using the utility function
  const rsvpCounts = normalizeRsvpCounts(event);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glass-effect max-w-md sm:max-w-lg animate-scale-in bg-gradient-to-b from-[#1A1D2D]/95 to-[#131722]/95 border-gray-700/50">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {event.title}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <Badge className={cn(
                "ml-2 font-medium",
                event.category in categoryColors 
                  ? categoryColors[event.category] 
                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
              )}>
                {event.category}
              </Badge>
              <Button 
                onClick={handleLike} 
                variant="ghost"
                size="icon"
                className="rounded-full p-1 hover:bg-red-500/10"
                disabled={isLiking}
              >
                <div className="relative">
                  <Heart className={cn("h-5 w-5 text-red-500", displayLikes > 0 ? "fill-red-500" : "")} />
                  {showSparkle && (
                    <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
                  )}
                </div>
                {displayLikes > 0 && (
                  <span className="ml-1 text-xs text-red-500">{displayLikes}</span>
                )}
              </Button>
            </div>
          </div>
          <DialogDescription className="text-muted-foreground mt-3 text-gray-300 font-light">
            {isLoadingDescription ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full bg-gray-700/50" />
                <Skeleton className="h-4 w-3/4 bg-gray-700/50" />
              </div>
            ) : (
              <div className="animate-fade-in">
                {fetchedDescription || event.description || 'Keine Beschreibung verfügbar.'}
                {descriptionSource !== 'original' && (
                  <Badge 
                    variant="outline" 
                    className="ml-2 text-xs border-gray-600 text-gray-400"
                  >
                    {descriptionSource === 'scraped' ? '🌐 Von Webseite' : '✨ AI-generiert'}
                  </Badge>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start">
            <div className="bg-red-500/20 p-2 rounded-md mr-3">
              <Calendar className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-white">Datum</div>
              <div className="text-sm text-gray-300">{formattedDate}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-red-500/20 p-2 rounded-md mr-3">
              <Clock className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-white">Uhrzeit</div>
              <div className="text-sm text-gray-300">{event.time} Uhr</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-red-500/20 p-2 rounded-md mr-3">
              <MapPin className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-white">Ort</div>
              <div className="text-sm text-gray-300">{event.location}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-red-500/20 p-2 rounded-md mr-3">
              <User className="h-5 w-5 text-red-400" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-white">Organisator</div>
              <div className="text-sm text-gray-300">{event.organizer}</div>
            </div>
          </div>
          
          <Separator className="bg-gray-700/50" />
          
          {/* RSVP Section */}
          <div className="mt-4">
            <div className="font-medium text-white mb-2">Teilnahme</div>
            <div className="grid grid-cols-3 gap-3">
              <Button 
                onClick={() => handleRsvp('yes')} 
                variant="outline"
                className="flex flex-col items-center gap-1 py-3 bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
              >
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-white">Ja</span>
                <span className="text-xs text-gray-300">{rsvpCounts.yes}</span>
              </Button>
              <Button 
                onClick={() => handleRsvp('maybe')} 
                variant="outline"
                className="flex flex-col items-center gap-1 py-3 bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20"
              >
                <HelpCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-white">Vielleicht</span>
                <span className="text-xs text-gray-300">{rsvpCounts.maybe}</span>
              </Button>
              <Button 
                onClick={() => handleRsvp('no')} 
                variant="outline"
                className="flex flex-col items-center gap-1 py-3 bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
              >
                <X className="h-5 w-5 text-red-500" />
                <span className="text-white">Nein</span>
                <span className="text-xs text-gray-300">{rsvpCounts.no}</span>
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button 
            onClick={() => onJoinChat && onJoinChat(event.id, event.title)}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full border-none transition-all duration-300"
            disabled={!onJoinChat}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Join Chat
          </Button>
          <Button onClick={handleClose} className="rounded-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 border-none transition-all duration-300">
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetails;
