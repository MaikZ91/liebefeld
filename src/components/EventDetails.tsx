
import React, { useState } from 'react';
import { type Event } from '../types/eventTypes';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Heart, ThumbsUp, Fire, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventDetailsProps {
  event: Event;
  onClose: () => void;
  onLike?: () => void;
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

const EventDetails: React.FC<EventDetailsProps> = ({ event, onClose, onLike }) => {
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
  
  // Format the date for display
  const formattedDate = format(parseISO(event.date), 'EEEE, d. MMMM yyyy', { locale: de });
  
  // Determine which like icon to use based on number of likes
  const getLikeIcon = () => {
    const likes = event.likes || 0;
    if (likes > 5) {
      return <Fire className="h-5 w-5 text-red-500" />;
    }
    return <ThumbsUp className={cn("h-5 w-5", likes > 0 ? "text-red-500" : "text-white")} />;
  };
  
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
        </div>
        
        <DialogFooter className="flex justify-between">
          {onLike && (
            <Button 
              onClick={handleLike} 
              variant="outline"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white border-none transition-all duration-300"
            >
              <div className="relative">
                {getLikeIcon()}
                {showSparkle && (
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
                )}
              </div>
              {event.likes && event.likes > 5 ? "Hot! " : "Gefällt mir "}
              {event.likes && event.likes > 0 ? `(${event.likes})` : ''}
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
