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
import { createWorker } from 'tesseract.js';

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

const extractDate = (text: string): Date | null => {
  const datePatterns = [
    /(\d{1,2})\.(\d{1,2})\.(\d{4})/g,
    /(\d{1,2})\.(\d{1,2})\.(\d{2})/g,
    /(\d{1,2})\s(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s(\d{4})/gi,
    /(\d{1,2})\s(Jan|Feb|Mär|Apr|Mai|Jun|Jul|Aug|Sep|Okt|Nov|Dez)\s(\d{4})/gi,
  ];
  
  for (const pattern of datePatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      const match = matches[0];
      if (match[0].includes('.')) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3]);
        return new Date(year, month, day);
      } else {
        const day = parseInt(match[1]);
        const monthName = match[2].toLowerCase();
        const year = parseInt(match[3]);
        
        const monthMap: Record<string, number> = {
          'januar': 0, 'jan': 0,
          'februar': 1, 'feb': 1,
          'märz': 2, 'mär': 2,
          'april': 3, 'apr': 3,
          'mai': 4,
          'juni': 5, 'jun': 5,
          'juli': 6, 'jul': 6,
          'august': 7, 'aug': 7,
          'september': 8, 'sep': 8,
          'oktober': 9, 'okt': 9,
          'november': 10, 'nov': 10,
          'dezember': 11, 'dez': 11
        };
        
        const month = monthMap[monthName];
        return new Date(year, month, day);
      }
    }
  }
  
  return null;
};

const extractTime = (text: string): string | null => {
  const timePattern = /(\d{1,2})[:\.](\d{2})(?:\s*(?:Uhr|h))?/g;
  const matches = [...text.matchAll(timePattern)];
  
  if (matches.length > 0) {
    const match = matches[0];
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    return `${hours}:${minutes}`;
  }
  
  return null;
};

const detectCategory = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  for (const category of eventCategories) {
    if (lowerText.includes(category.toLowerCase())) {
      return category;
    }
  }
  
  if (lowerText.includes('musik') || lowerText.includes('band') || lowerText.includes('live')) {
    return 'Konzert';
  } else if (lowerText.includes('ausstellung') || lowerText.includes('galerie') || lowerText.includes('kunst')) {
    return 'Ausstellung';
  } else if (lowerText.includes('sport') || lowerText.includes('spiel') || lowerText.includes('turnier')) {
    return 'Sport';
  } else if (lowerText.includes('party') || lowerText.includes('feier') || lowerText.includes('dj')) {
    return 'Party';
  } else if (lowerText.includes('workshop') || lowerText.includes('seminar') || lowerText.includes('kurs')) {
    return 'Workshop';
  } else if (lowerText.includes('theater') || lowerText.includes('film') || lowerText.includes('lesung')) {
    return 'Kultur';
  }
  
  return 'Sonstiges';
};

const extractLocation = (text: string): string => {
  const locationIndicators = [
    'ort:', 'location:', 'veranstaltungsort:', 'venue:', 'adresse:', 'address:',
    'in der', 'im', 'at the', 'bei', 'at'
  ];
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const indicator of locationIndicators) {
      if (lowerLine.includes(indicator)) {
        if (['in der', 'im', 'at the', 'bei', 'at'].includes(indicator)) {
          return line.trim();
        } else {
          const parts = line.split(new RegExp(indicator, 'i'));
          if (parts.length > 1) {
            return parts[1].trim();
          }
        }
      }
    }
  }
  
  const bielefelderVenues = [
    'Forum', 'Ringlokschuppen', 'Lokschuppen', 'Stadthalle', 'Jazzclub', 
    'Falkendom', 'Movie', 'Stereo', 'Bunker Ulmenwall', 'Nr.z.P.', 
    'Forum Bielefeld', 'Stadtpark', 'City Park', 'Kesselbrink'
  ];
  
  for (const venue of bielefelderVenues) {
    if (text.includes(venue)) {
      for (const line of lines) {
        if (line.includes(venue)) {
          return line.trim();
        }
      }
      return venue;
    }
  }
  
  return '';
};

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
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !date || !time) {
      return;
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
      setRecognitionProgress(0);
      
      toast({
        title: "OCR Analyse gestartet",
        description: "Das Bild wird analysiert. Dies kann einen Moment dauern.",
      });
      
      const worker = await createWorker('deu');
      
      worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÄÖÜäöüß0123456789.,;:!?@#$%&*()-+=/\\\'"`~<>{}[]|_^°€ ',
      });
      
      worker.on('progress', (progress) => {
        console.log('OCR Progress:', progress);
        if (progress.status === 'recognizing text') {
          setRecognitionProgress(progress.progress * 100);
        }
      });
      
      const result = await worker.recognize(base64Image);
      console.log("OCR Result:", result.data);
      
      const extractedText = result.data.text;
      
      const lines = extractedText.split('\n').filter(line => line.trim() !== '');
      
      let extractedTitle = '';
      for (const line of lines.slice(0, 5)) {
        const words = line.trim().split(/\s+/);
        if (words.length > 2 && line.length > 10) {
          extractedTitle = line.trim();
          break;
        }
      }
      
      const extractedDate = extractDate(extractedText);
      
      const extractedTime = extractTime(extractedText) || '19:00';
      
      const extractedDescription = extractedText.slice(0, 500);
      
      const detectedCategory = detectCategory(extractedText);
      
      const extractedLocation = extractLocation(extractedText);
      
      let extractedOrganizer = '';
      const organizerIndicators = ['veranstalter:', 'präsentiert von:', 'presented by:', 'organizer:'];
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        for (const indicator of organizerIndicators) {
          if (lowerLine.includes(indicator)) {
            extractedOrganizer = line.replace(new RegExp(indicator, 'i'), '').trim();
            break;
          }
        }
        if (extractedOrganizer) break;
      }
      
      if (extractedTitle) setTitle(extractedTitle);
      if (extractedDate) setDate(extractedDate);
      setTime(extractedTime);
      if (extractedDescription) setDescription(extractedDescription);
      if (extractedLocation) setLocation(extractedLocation);
      if (extractedOrganizer) setOrganizer(extractedOrganizer);
      setCategory(detectedCategory);
      
      await worker.terminate();
      
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
      setRecognitionProgress(0);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      toast({
        variant: "destructive",
        title: "Ungültiges Dateiformat",
        description: "Bitte wähle ein Bild (JPEG, PNG, etc.)",
      });
      return;
    }
    
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
              <div className="flex flex-col items-center gap-2 w-full">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${recognitionProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {recognitionProgress < 100 
                    ? `Analysiere Bild... ${Math.round(recognitionProgress)}%`
                    : 'Extrahiere Eventdaten...'}
                </span>
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
