
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
import { CalendarIcon, Clock, MapPin, User, LayoutGrid, AlignLeft, DollarSign, Euro, Info, Mail, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  url: string;
  setUrl: (url: string) => void;
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
  error,
  url, setUrl
}) => {
  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 w-full">
          {error}
        </div>
      )}
      
      <div className="grid gap-6 py-4 w-full max-w-4xl mx-auto">
        <div className="grid gap-2 w-full">
          <div className="flex items-center">
            <LayoutGrid className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label htmlFor="title">Titel</Label>
          </div>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event Titel"
            className="rounded-lg w-full"
            required
          />
        </div>
        
        <div className="grid gap-2 w-full">
          <div className="flex items-center">
            <AlignLeft className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label htmlFor="description">Beschreibung</Label>
          </div>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Beschreibe dein Event..."
            className="rounded-lg min-h-[100px] w-full"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="grid gap-2 w-full">
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
          
          <div className="grid gap-2 w-full">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <Label htmlFor="time">Uhrzeit</Label>
            </div>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-lg w-full"
              required
            />
          </div>
        </div>
        
        <div className="grid gap-2 w-full">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label htmlFor="location">Ort</Label>
          </div>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Veranstaltungsort in Bielefeld"
            className="rounded-lg w-full"
          />
        </div>
        
        <div className="grid gap-2 w-full">
          <div className="flex items-center">
            <LinkIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label htmlFor="url">URL</Label>
          </div>
          <Input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.example.com"
            className="rounded-lg w-full"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="grid gap-2 w-full">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground" />
              <Label htmlFor="organizer">Organisator</Label>
            </div>
            <Input
              id="organizer"
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              placeholder="Name oder Organisation"
              className="rounded-lg w-full"
            />
          </div>
          
          <div className="grid gap-2 w-full">
            <Label htmlFor="category">Kategorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-lg w-full">
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
        
        <div className="grid gap-2 w-full">
          <div className="flex items-center space-x-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg w-full">
            <Checkbox 
              id="isPaid" 
              checked={isPaid} 
              onCheckedChange={(checked) => {
                setIsPaid(checked === true);
                if (checked === false) {
                  setPaypalLink('');
                }
              }}
              className="h-5 w-5 border-2 border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" 
            />
            <div className="grid gap-1.5 w-full">
              <Label 
                htmlFor="isPaid" 
                className="flex items-center text-base font-medium text-red-700 dark:text-red-300"
              >
                <DollarSign className="h-5 w-5 mr-2 text-red-500" />
                Kostenpflichtiges Event
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-2 text-red-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800/30 p-3 max-w-xs">
                      <p>Für kostenpflichtige Events wird eine Gebühr erhoben.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              
              {isPaid && (
                <div className="text-sm font-medium text-red-600 dark:text-red-400 flex flex-col gap-2 ml-1 mt-2 p-4 bg-red-100 dark:bg-red-900/30 rounded-md border border-red-200 dark:border-red-800/30 w-full">
                  <p className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span>Für das Bewerben von kostenpflichtigen Events wie Workshops etc. wird eine Gebühr erhoben.</span>
                  </p>
                  <p className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span>Schreib uns dazu einfach eine Anfrage an <a href="mailto:maik.z@gmx.de" className="underline hover:text-red-700">maik.z@gmx.de</a></span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventFormFields;
