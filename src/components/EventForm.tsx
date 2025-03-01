
import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Event } from './EventCalendar';
import { DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { CalendarIcon, Clock, MapPin, User, LayoutGrid, AlignLeft, Camera, Upload, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface EventFormProps {
  selectedDate: Date;
  onAddEvent: (event: Omit<Event, 'id'>) => void;
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

const EventForm: React.FC<EventFormProps> = ({ selectedDate, onAddEvent }) => {
  const [date, setDate] = useState<Date>(selectedDate);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('19:00');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [category, setCategory] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date || !time) {
      return; // Prevent submission if required fields are missing
    }
    
    const newEvent: Omit<Event, 'id'> = {
      title,
      description,
      date: date.toISOString().split('T')[0],
      time,
      location,
      organizer,
      category: category || 'Sonstiges',
    };
    
    onAddEvent(newEvent);
    
    // Reset form (though dialog will close anyway)
    setTitle('');
    setDescription('');
    setTime('');
    setLocation('');
    setOrganizer('');
    setCategory('');
    setImagePreview(null);
  };
  
  const handleImageCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const extractEventDataFromImage = async (base64Image: string) => {
    try {
      setIsAnalyzing(true);
      
      // Here we would normally call an API to analyze the image
      // For demonstration purposes, we'll simulate a response after a delay
      
      // In a real implementation, you would call a service like Google Cloud Vision API
      // or another OCR/AI service that can extract text and understand event data
      
      console.log("Analyzing image...");
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate extracted data (in real implementation, this would come from API)
      const simulatedResponse = {
        title: "Demo Konzert",
        description: "Ein tolles Konzert im Bielefeld City Park",
        date: new Date(),
        time: "20:00",
        location: "City Park, Bielefeld",
        organizer: "Bielefeld Kultur",
        category: "Konzert"
      };
      
      // Set the extracted data to form fields
      setTitle(simulatedResponse.title);
      setDescription(simulatedResponse.description);
      setDate(simulatedResponse.date);
      setTime(simulatedResponse.time);
      setLocation(simulatedResponse.location);
      setOrganizer(simulatedResponse.organizer);
      setCategory(simulatedResponse.category);
      
      toast({
        title: "Bild analysiert",
        description: "Die Eventdaten wurden aus dem Bild extrahiert. Bitte überprüfe und ergänze die Daten wenn nötig.",
      });
      
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        variant: "destructive",
        title: "Fehler bei der Bildanalyse",
        description: "Das Bild konnte nicht analysiert werden. Bitte gib die Daten manuell ein.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      toast({
        variant: "destructive",
        title: "Ungültiges Dateiformat",
        description: "Bitte wähle ein Bild (JPEG, PNG, etc.)",
      });
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagePreview(event.target.result as string);
        extractEventDataFromImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="text-2xl">Event erstellen</DialogTitle>
        <DialogDescription>
          Füge ein neues Event zum Liebefeld Community Kalender hinzu.
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        {/* Image upload section */}
        <div className="grid gap-2">
          <Label className="mb-1">Plakat hochladen (Optional)</Label>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleImageCapture}
                className="rounded-lg flex items-center gap-1"
                disabled={isAnalyzing}
              >
                <Camera className="h-4 w-4" />
                Foto aufnehmen
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleImageCapture}
                className="rounded-lg flex items-center gap-1"
                disabled={isAnalyzing}
              >
                <Upload className="h-4 w-4" />
                Bild hochladen
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                capture="environment"
              />
            </div>
            
            {isAnalyzing && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm text-muted-foreground">Analysiere Bild...</span>
              </div>
            )}
            
            {imagePreview && !isAnalyzing && (
              <div className="relative overflow-hidden rounded-lg w-full max-w-xs">
                <img 
                  src={imagePreview} 
                  alt="Event Plakat Vorschau" 
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>
        
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
      
      <DialogFooter>
        <Button type="submit" className="rounded-full w-full sm:w-auto">
          Event erstellen
        </Button>
      </DialogFooter>
    </form>
  );
};

export default EventForm;
