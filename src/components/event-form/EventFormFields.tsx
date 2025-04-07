
import React from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Clock, MapPin, User, LayoutGrid, AlignLeft, DollarSign, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventFormFieldsProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  date: Date;
  setDate: (date: Date) => void;
  time: string;
  setTime: (time: string) => void;
  location: string;
  setLocation: (location: string) => void;
  organizer: string;
  setOrganizer: (organizer: string) => void;
  category: string;
  setCategory: (category: string) => void;
  isPaid: boolean;
  setIsPaid: (isPaid: boolean) => void;
  paypalLink: string;
  setPaypalLink: (paypalLink: string) => void;
  eventCategories: string[];
  error: string | null;
}

const EventFormFields: React.FC<EventFormFieldsProps> = ({
  title, setTitle,
  description, setDescription,
  date, setDate,
  time, setTime,
  location, setLocation,
  organizer, setOrganizer,
  category, setCategory,
  isPaid, setIsPaid,
  paypalLink, setPaypalLink,
  eventCategories,
  error
}) => {
  return (
    <>
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
        
        <div className="grid gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isPaid" 
              checked={isPaid} 
              onCheckedChange={(checked) => {
                setIsPaid(checked === true);
                if (checked === false) {
                  setPaypalLink('');
                }
              }} 
            />
            <div className="grid gap-1.5">
              <Label htmlFor="isPaid" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                Kostenpflichtiges Event
              </Label>
              {isPaid && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Euro className="h-4 w-4" />
                  <span>Für kostenpflichtige Events wird eine Gebühr von 10€ erhoben</span>
                </p>
              )}
            </div>
          </div>
          
          {isPaid && (
            <div className="grid gap-2 mt-2 ml-7">
              <Label htmlFor="paypalLink">PayPal Link (optional)</Label>
              <Input
                id="paypalLink"
                value={paypalLink}
                onChange={(e) => setPaypalLink(e.target.value)}
                placeholder="https://paypal.me/yourlink"
                className="rounded-lg"
              />
              <p className="text-xs text-muted-foreground">
                Gib den Link zu deiner PayPal-Zahlungsseite ein, wenn Besucher dort Tickets kaufen können
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EventFormFields;
