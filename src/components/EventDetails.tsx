
import React, { useState } from 'react';
import { type Event, RsvpOption, normalizeRsvpCounts } from '../types/eventTypes';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Heart, Check, X, HelpCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface EventDetailsProps {
  event: Event;
  onClose: () => void;
  onLike?: () => void;
  onRsvp?: (option: RsvpOption) => void;
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

const EventDetails: React.FC<EventDetailsProps> = ({ event, onClose, onLike, onRsvp }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showSparkle, setShowSparkle] = useState(false);
  
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Allow animation to complete
  };

  const handleLike = () => {
    setShowSparkle(true);
    setTimeout(() => setShowSparkle(false), 1000);
    if (onLike) {
      onLike();
    }
  };
  
  const handleRsvp = (option: RsvpOption) => {
    if (onRsvp) {
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
            <Badge className={cn(
              "ml-2 font-medium",
              event.category in categoryColors 
                ? categoryColors[event.category] 
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            )}>
              {event.category}
            </Badge>
          </div>
          <DialogDescription className="text-muted-foreground mt-3 text-gray-300 font-light">
            {event.description}
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
          {onLike && (
            <Button 
              onClick={handleLike} 
              variant="outline"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-none transition-all duration-300"
            >
              <div className="relative">
                <Heart className={cn("h-4 w-4", event.likes && event.likes > 0 ? "fill-white text-white" : "")} />
                {showSparkle && (
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
                )}
              </div>
              Gefällt mir {event.likes && event.likes > 0 ? `(${event.likes})` : ''}
            </Button>
          )}
          <Button onClick={handleClose} className="rounded-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 border-none transition-all duration-300">
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetails;
