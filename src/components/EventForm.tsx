
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
import { CalendarIcon, Clock, MapPin, User, LayoutGrid, AlignLeft, X, Camera, Upload, Image } from 'lucide-react';
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
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Add to existing images
      setImages(prev => [...prev, ...newFiles]);
      
      // Create preview URLs for the new images
      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      
      // Reset the input value so the same file can be selected again if needed
      e.target.value = '';
    }
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
    // Release the object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    // Remove the image from state
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
      
      // Upload the file to Supabase Storage
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
      
      // Get the public URL for the uploaded file
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
    
    setIsSubmitting(true);
    
    try {
      // Fix for date timezone issue - ensure we get the correct date
      // Format the date without timezone adjustments to preserve the selected date
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log('Selected date:', date);
      console.log('Formatted date for DB:', formattedDate);
      
      const newEvent: Omit<Event, 'id'> = {
        title,
        description,
        date: formattedDate,  // Use formatted date string
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
        const eventId = data[0].id;
        
        // Upload any attached images to Supabase
        let imageUrls: string[] = [];
        if (images.length > 0) {
          try {
            toast({
              title: "Bilder werden hochgeladen",
              description: `${images.length} Bilder werden hochgeladen...`,
            });
            
            imageUrls = await uploadImagesToSupabase(eventId);
            
            // Update the event with image URLs
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
        
        // Event successfully saved, update the local list
        onAddEvent({
          ...newEvent,
          id: data[0].id,
          image_urls: imageUrls.length > 0 ? imageUrls : undefined
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
        setImages([]);
        setPreviewUrls([]);
        
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
          date: format(date, 'yyyy-MM-dd'),
          time,
          location,
          organizer,
          category: category || 'Sonstiges',
          image_urls: [] // Add empty array for fallback
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
        
        {/* Image Upload Section */}
        <div className="grid gap-2 mt-2">
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
          
          {/* Image Preview */}
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
