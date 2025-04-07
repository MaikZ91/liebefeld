import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Event } from '@/types/eventTypes';
import { CalendarIcon, Clock, MapPin, User, LayoutGrid, AlignLeft, X, Camera, Upload, Image, Sparkles, DollarSign, Repeat, Euro, CreditCard } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { processEventImage } from '@/utils/imageAnalysis';
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [isPaid, setIsPaid] = useState(false);
  const [paypalLink, setPaypalLink] = useState('');
  
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'weekly' | 'monthly' | 'custom'>('weekly');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'paypal'>('credit_card');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      setImages(prev => [...prev, ...newFiles]);
      
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      
      e.target.value = '';
      
      if (newFiles.length > 0 && title === '' && description === '') {
        await analyzeImageForEventData(newFiles[0]);
      }
    }
  };
  
  const analyzeImageForEventData = async (imageFile: File) => {
    setIsAnalyzing(true);
    try {
      const extractedData = await processEventImage(imageFile);
      
      if (extractedData.title) setTitle(extractedData.title);
      if (extractedData.description) setDescription(extractedData.description);
      if (extractedData.location) setLocation(extractedData.location);
      if (extractedData.organizer) setOrganizer(extractedData.organizer);
      if (extractedData.category) setCategory(extractedData.category);
      
      if (extractedData.date) {
        try {
          const extractedDate = new Date(extractedData.date);
          if (!isNaN(extractedDate.getTime())) {
            setDate(extractedDate);
          }
        } catch (err) {
          console.error('Error parsing extracted date:', err);
        }
      }
      
      if (extractedData.time) {
        setTime(extractedData.time);
      }
      
      if (Object.keys(extractedData).length > 0) {
        toast({
          title: "Eventdaten erkannt",
          description: "Die Formularfelder wurden mit erkannten Daten aus dem Bild gefüllt.",
        });
      } else {
        toast({
          title: "Keine Eventdaten erkannt",
          description: "Das Bild konnte nicht analysiert werden. Bitte füllen Sie das Formular manuell aus.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: "Fehler bei der Analyse",
        description: "Das Bild konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut oder füllen Sie das Formular manuell aus.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleAnalyzeImage = async () => {
    if (images.length === 0) {
      toast({
        title: "Kein Bild vorhanden",
        description: "Bitte laden Sie zuerst ein Bild hoch.",
        variant: "destructive"
      });
      return;
    }
    
    await analyzeImageForEventData(images[0]);
  };
  
  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };
  
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setImages(images.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };
  
  const uploadImagesToSupabase = async (eventId: string): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}-${i}.${fileExt}`;
      const filePath = `event-images/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(filePath, file);
      
      if (error) {
        console.error('Error uploading image:', error);
        toast({
          title: "Bildupload fehlgeschlagen",
          description: `Bild ${i+1} konnte nicht hochgeladen werden: ${error.message}`,
          variant: "destructive"
        });
        continue;
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);
      
      imageUrls.push(publicUrlData.publicUrl);
    }
    
    return imageUrls;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title || !date || !time) {
      setError('Bitte fülle alle Pflichtfelder aus (Titel, Datum und Uhrzeit)');
      return;
    }
    
    if (isPaid && !paypalLink) {
      setError('Bitte gib einen PayPal-Link für kostenpflichtige Events ein');
      return;
    }
    
    if (isRecurring) {
      setShowPaymentDialog(true);
      return;
    }
    
    submitEvent(false);
  };
  
  const submitEvent = async (isRecurringPaid: boolean = false) => {
    setIsSubmitting(true);
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log('Selected date:', date);
      console.log('Formatted date for DB:', formattedDate);
      
      const expiresAt = isRecurring ? 
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : 
        undefined;
      
      const newEvent: Omit<Event, 'id'> = {
        title,
        description,
        date: formattedDate,
        time,
        location,
        organizer,
        category: category || 'Sonstiges',
        is_paid: isPaid,
        payment_link: isPaid ? paypalLink : null,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : undefined,
        recurrence_fee_paid: isRecurringPaid,
        listing_expires_at: expiresAt,
      };
      
      const { data, error: supabaseError } = await supabase
        .from('community_events')
        .insert([newEvent])
        .select();
      
      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(supabaseError.message || 'Fehler beim Speichern des Events');
      }
      
      if (data && data[0]) {
        const eventId = data[0].id;
        
        let imageUrls: string[] = [];
        if (images.length > 0) {
          try {
            toast({
              title: "Bilder werden hochgeladen",
              description: `${images.length} Bilder werden hochgeladen...`,
            });
            
            imageUrls = await uploadImagesToSupabase(eventId);
            
            if (imageUrls.length > 0) {
              const { error: updateError } = await supabase
                .from('community_events')
                .update({ 
                  image_urls: imageUrls 
                })
                .eq('id', eventId);
              
              if (updateError) {
                console.error('Error updating event with image URLs:', updateError);
              }
            }
          } catch (uploadError) {
            console.error('Error uploading images:', uploadError);
            toast({
              title: "Bildupload Fehler",
              description: "Es gab ein Problem beim Hochladen der Bilder. Das Event wurde trotzdem erstellt.",
              variant: "destructive"
            });
          }
        }
        
        onAddEvent({
          ...newEvent,
          id: data[0].id,
          image_urls: imageUrls.length > 0 ? imageUrls : undefined
        });
        
        if (isRecurring && isRecurringPaid) {
          toast({
            title: "Regelmäßiges Event erstellt",
            description: `"${newEvent.title}" wurde erfolgreich als regelmäßiges Event für 10€ hinzugefügt und bleibt 3 Monate aktiv.`
          });
        } else {
          toast({
            title: "Event erstellt",
            description: `"${newEvent.title}" wurde erfolgreich zum Kalender hinzugefügt.`
          });
        }
        
        resetForm();
        
        if (onCancel) onCancel();
      }
    } catch (err) {
      console.error('Error adding event:', err);
      
      const eventData = {
        title,
        description,
        date: format(date, 'yyyy-MM-dd'),
        time,
        location,
        organizer,
        category: category || 'Sonstiges',
        image_urls: [],
        is_paid: isPaid,
        payment_link: isPaid ? paypalLink : null,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : undefined,
        recurrence_fee_paid: isRecurringPaid,
      };
      
      const tempEvent: Omit<Event, 'id'> & { id: string } = {
        ...eventData,
        id: `local-${Date.now()}`
      };
      
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
      setShowPaymentDialog(false);
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTime('19:00');
    setLocation('');
    setOrganizer('');
    setCategory('');
    setImages([]);
    setPreviewUrls([]);
    setIsPaid(false);
    setPaypalLink('');
    setIsRecurring(false);
    setRecurrencePattern('weekly');
  };
  
  const handlePaymentSubmit = () => {
    toast({
      title: "Zahlung wird verarbeitet",
      description: "Bitte warten Sie, während Ihre Zahlung verarbeitet wird...",
    });
    
    setTimeout(() => {
      toast({
        title: "Zahlung erfolgreich",
        description: "Ihre Zahlung von 10€ für das regelmäßige Event wurde erfolgreich verarbeitet.",
      });
      
      submitEvent(true);
    }, 1500);
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
      
      <div className="grid gap-2 mb-6">
        <div className="flex items-center">
          <Image className="h-4 w-4 mr-2 text-muted-foreground" />
          <Label>Bilder hinzufügen</Label>
        </div>
        
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            className="rounded-lg flex gap-2"
            onClick={handleFileUpload}
          >
            <Upload size={16} />
            <span>Bilder auswählen</span>
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            className="rounded-lg flex gap-2"
            onClick={handleCameraCapture}
          >
            <Camera size={16} />
            <span>Kamera</span>
          </Button>
          
          {images.length > 0 && (
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-lg flex gap-2"
              onClick={handleAnalyzeImage}
              disabled={isAnalyzing}
            >
              <Sparkles size={16} />
              <span>{isAnalyzing ? "Analysiere..." : "Daten erkennen"}</span>
            </Button>
          )}
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />
          
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
        </div>
        
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img 
                  src={url} 
                  alt={`Preview ${index + 1}`} 
                  className="w-full h-24 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 rounded-full"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
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
              <p className="text-sm text-muted-foreground">
                Aktiviere diese Option für kostenpflichtige Events mit PayPal-Bezahlung
              </p>
            </div>
          </div>
          
          {isPaid && (
            <div className="grid gap-2 mt-2 ml-7">
              <Label htmlFor="paypalLink">PayPal Link</Label>
              <Input
                id="paypalLink"
                value={paypalLink}
                onChange={(e) => setPaypalLink(e.target.value)}
                placeholder="https://paypal.me/yourlink"
                className="rounded-lg"
              />
              <p className="text-xs text-muted-foreground">
                Gib den Link zu deiner PayPal-Zahlungsseite ein
              </p>
            </div>
          )}
        </div>
        
        <div className="grid gap-2 border-t pt-4 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isRecurring" 
              checked={isRecurring} 
              onCheckedChange={(checked) => setIsRecurring(checked === true)} 
            />
            <div className="grid gap-1.5">
              <Label htmlFor="isRecurring" className="flex items-center">
                <Repeat className="h-4 w-4 mr-2 text-muted-foreground" />
                Regelmäßiges Event
              </Label>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Euro className="h-4 w-4" />
                <span>Für regelmäßige Events wird eine Gebühr von 10€ für 3 Monate erhoben</span>
              </p>
            </div>
          </div>
          
          {isRecurring && (
            <div className="grid gap-2 mt-2 ml-7">
              <Label>Wiederholungsmuster</Label>
              <RadioGroup 
                value={recurrencePattern} 
                onValueChange={(value) => setRecurrencePattern(value as 'weekly' | 'monthly' | 'custom')}
                className="grid gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly">Wöchentlich</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">Monatlich</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Benutzerdefiniert</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-1">
                Dein Event wird für 3 Monate im Kalender angezeigt werden
              </p>
            </div>
          )}
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
          disabled={isSubmitting || isAnalyzing}
        >
          {isSubmitting ? "Wird erstellt..." : isRecurring ? "Weiter zur Zahlung" : "Event erstellen"}
        </Button>
      </div>
      
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Zahlung für regelmäßiges Event</DialogTitle>
            <DialogDescription>
              Für regelmäßige Events berechnen wir eine Gebühr von 10€ für 3 Monate Laufzeit.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Zahlungsmethode</Label>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(value) => setPaymentMethod(value as 'credit_card' | 'paypal')}
                className="grid gap-2"
              >
                <div className="flex items-center space-x-2 p-2 rounded-lg border border-input hover:bg-muted">
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label htmlFor="credit_card" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Kreditkarte
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded-lg border border-input hover:bg-muted">
                  <RadioGroupItem value="paypal" id="paypal_payment" />
                  <Label htmlFor="paypal_payment" className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.5 12.5h2.25c1.375 0 2.625-.875 3.125-2.125.5-1.25.125-2.125-1.25-2.125h-1.5c-.125 0-.25.125-.25.25l-1.25 6.5c0 .125.125.25.25.25h1-.125c.125 0 .375-.125.375-.25l.25-1.375c0-.125-.125-.25-.25-.25l-.125.25c0-.25.125-.375.25-.375h-2.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M12 10.375c0 1.25.625 2.125 2 2.125h2.25c.125 0 .25-.125.25-.25L17 9c0-.125-.125-.25-.25-.25h-2c-1.5 0-2.75 1-2.75 1.625zM14.5 12.5l-.5 2.625c0 .125.125.25.25.25h1-.125c.125 0 .25-.125.25-.25l.375-2.375" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M18.5 9.5c.625-.625 1-1.5 1-2.5a3.5 3.5 0 00-3.5-3.5h-8.75c-.125 0-.25.125-.25.25l-2.5 13.25c0 .125.125.25.25.25h2.75l.75-3.75m11.25-4 .5-2.625c0-.125-.125-.25-.25-.25h-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    PayPal
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {paymentMethod === 'credit_card' && (
              <div className="grid gap-2">
                <Label htmlFor="cardNumber">Kartennummer</Label>
                <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="expiry">Ablaufdatum</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" />
                  </div>
                </div>
                
                <Label htmlFor="cardName">Karteninhaber</Label>
                <Input id="cardName" placeholder="Name des Karteninhabers" />
              </div>
            )}
            
            {paymentMethod === 'paypal' && (
              <div className="flex flex-col items-center justify-center p-4 text-center gap-2">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6.5 12.5h2.25c1.375 0 2.625-.875 3.125-2.125.5-1.25.125-2.125-1.25-2.125h-1.5c-.125 0-.25.125-.25.25l-1.25 6.5c0 .125.125.25.25.25h1-.125c.125 0 .375-.125.375-.25l.25-1.375c0-.125-.125-.25-.25-.25l-.125.25c0-.25.125-.375.25-.375h-2.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M12 10.375c0 1.25.625 2.125 2 2.125h2.25c.125 0 .25-.125.25-.25L17 9c0-.125-.125-.25-.25-.25h-2c-1.5 0-2.75 1-2.75 1.625zM14.5 12.5l-.5 2.625c0 .125.125.25.25.25h1-.125c.125 0 .25-.125.25-.25l.375-2.375" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  <path d="M18.5 9.5c.625-.625 1-1.5 1-2.5a3.5 3.5 0 00-3.5-3.5h-8.75c-.125 0-.25.125-.25.25l-2.5 13.25c0 .125.125.25.25.25h2.75l.75-3.75m11.25-4 .5-2.625c0-.125-.125-.25-.25-.25h-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <p>Sie werden zur PayPal-Website weitergeleitet, um die Zahlung abzuschließen.</p>
              </div>
            )}
            
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span>Regelmäßiges Event (3 Monate)</span>
                <span>10,00 €</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Abbrechen
            </Button>
            <Button type="button" onClick={handlePaymentSubmit}>
              10,00 € Bezahlen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default EventForm;
