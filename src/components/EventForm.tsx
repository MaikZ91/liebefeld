import React, { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Event } from './EventCalendar';
import { CalendarIcon, Clock, MapPin, User, LayoutGrid, AlignLeft, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EventFormProps {
  selectedDate: Date;
  onAddEvent: (event: Omit<Event, 'id'> & { id?: string }) => void;
  onCancel?: () => void;
}

const eventCategories = [
  'Konzert',
  'Party',
  'Ausstellung',
  'Sport',
  'Workshop',
  'Kultur',
  'Sonstiges'
];

const EventForm: React.FC<EventFormProps> = ({ selectedDate, onAddEvent, onCancel }) => {
  const [date, setDate] = useState<Date>(selectedDate);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('19:00');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title || !date || !time) {
      setError('Bitte fülle alle Pflichtfelder aus (Titel, Datum und Uhrzeit)');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newEvent: Omit<Event, 'id'> = {
        title,
        description,
        date: date.toISOString().split('T')[0],
        time,
        location,
        organizer,
        category: category || 'Sonstiges',
      };
      
      // Try saving directly to Supabase first
      const { data, error: supabaseError } = await supabase
        .from('community_events')
        .insert([newEvent])
        .select();
      
      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(supabaseError.message || 'Fehler beim Speichern des Events');
      }
      
      if (data && data[0]) {
        // Event successfully saved, update the local list
        onAddEvent({
          ...newEvent,
          id: data[0].id
        });
        
        toast({
          title: "Event erstellt",
          description: `"${newEvent.title}" wurde erfolgreich zum Kalender hinzugefügt.`,
        });
        
        // Reset form
        setTitle('');
        setDescription('');
        setTime('19:00');
        setLocation('');
        setOrganizer('');
        setCategory('');
        
        // Hide form after successful addition
        if (onCancel) onCancel();
      }
    } catch (err) {
      console.error('Error adding event:', err);
      
      // Add fallback behavior: Add to local state even if Supabase fails
      const tempEvent: Omit<Event, 'id'> & { id: string } = {
        ...{
          title,
          description,
          date: date.toISOString().split('T')[0],
          time,
          location,
          organizer,
          category: category || 'Sonstiges',
        },
        id: `local-${Date.now()}`
      };
      
      // Still add to local state so UI works
      onAddEvent(tempEvent);
      
      if (onCancel) onCancel();
      
      const errorMessage = err instanceof Error ? err.message : 'Das Event konnte nicht in der Datenbank gespeichert werden, aber es wurde lokal hinzugefügt.';
      
      toast({
        title: "Event wurde lokal hinzugefügt",
        description: "Das Event wurde zum Kalender hinzugefügt, konnte aber nicht in der Datenbank gespeichert werden aufgrund von Berechtigungsproblemen.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Event erstellen</h2>
        {onCancel && (
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            onClick={onCancel}
            className="rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <p className="text-muted-foreground mb-6">
        Füge ein neues Event zum Liebefeld Community Kalender hinzu.
      </p>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <div className="flex items-center">
            <LayoutGrid className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label htmlFor="title">Titel</Label>
          </div>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event Titel"
            className="rounded-lg"
            required
          />
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center">
            <AlignLeft className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label htmlFor="description">Beschreibung</Label>
          </div>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibe dein Event..."
            className="rounded-lg min-h-[80px]"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <Label>Datum</Label>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-lg",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: de }) : <span>Datum wählen</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <Label htmlFor="time">Uhrzeit</Label>
            </div>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-lg"
              required
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label htmlFor="location">Ort</Label>
          </div>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Veranstaltungsort in Bielefeld"
            className="rounded-lg"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <Label htmlFor="organizer">Organisator</Label>
            </div>
            <Input
              id="organizer"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="Name oder Organisation"
              className="rounded-lg"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="category">Kategorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {eventCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 mt-4">
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="rounded-full"
          >
            Abbrechen
          </Button>
        )}
        <Button 
          type="submit" 
          className="rounded-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Wird erstellt..." : "Event erstellen"}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;
