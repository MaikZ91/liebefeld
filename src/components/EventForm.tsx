import React, { useState } from 'react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { processEventImage } from '@/utils/imageAnalysis';
import { type Event } from '@/types/eventTypes';

// Import our new components
import ImageUploader from './event-form/ImageUploader';
import EventFormFields from './event-form/EventFormFields';
import PaymentDialog from './event-form/PaymentDialog';
import FormHeader from './event-form/FormHeader';
import FormFooter from './event-form/FormFooter';

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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
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
    
    if (isPaid) {
      setShowPaymentDialog(true);
      return;
    }
    
    submitEvent(false);
  };
  
  const submitEvent = async (isPaidAndProcessed: boolean = false) => {
    setIsSubmitting(true);
    
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      console.log('Selected date:', date);
      console.log('Formatted date for DB:', formattedDate);
      
      const expiresAt = isPaid ? 
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
        payment_link: isPaid ? 'maik.z@gmx.de' : null,
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
        
        if (isPaid && isPaidAndProcessed) {
          toast({
            title: "Kostenpflichtiges Event erstellt",
            description: `"${newEvent.title}" wurde erfolgreich als kostenpflichtiges Event für 10€ hinzugefügt.`
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
      
      const expiresAt = isPaid ? 
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : 
        undefined;
      
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
        payment_link: isPaid ? 'maik.z@gmx.de' : null,
        listing_expires_at: expiresAt,
      };
      
      const tempEvent: Omit<Event, 'id'> & { id: string } = {
        ...eventData,
        id: `local-${Date.now()}`
      };
      
      onAddEvent(tempEvent);
      
      if (onCancel) onCancel();
      
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
  };
  
  const handlePaymentSubmit = () => {
    toast({
      title: "Event wird erstellt",
      description: "Dein kostenpflichtiges Event wird erstellt. Wir werden dich bezüglich der Zahlung kontaktieren.",
    });
    
    submitEvent(true);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <FormHeader onCancel={onCancel} />
      
      <p className="text-muted-foreground mb-6">
        Füge ein neues Event zum Liebefeld Community Kalender hinzu.
      </p>
      
      <ImageUploader 
        images={images}
        previewUrls={previewUrls}
        isAnalyzing={isAnalyzing}
        onFileChange={handleFileChange}
        onAnalyzeImage={handleAnalyzeImage}
        onRemoveImage={removeImage}
      />
      
      <EventFormFields 
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        date={date}
        setDate={setDate}
        time={time}
        setTime={setTime}
        location={location}
        setLocation={setLocation}
        organizer={organizer}
        setOrganizer={setOrganizer}
        category={category}
        setCategory={setCategory}
        isPaid={isPaid}
        setIsPaid={setIsPaid}
        paypalLink={paypalLink}
        setPaypalLink={setPaypalLink}
        eventCategories={eventCategories}
        error={error}
      />
      
      <FormFooter 
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        isPaid={isPaid}
      />
      
      <PaymentDialog 
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onSubmitPayment={handlePaymentSubmit}
        contactEmail="maik.z@gmx.de"
      />
    </form>
  );
};

export default EventForm;
