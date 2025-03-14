
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface ExtractedEventData {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  organizer?: string;
  category?: string;
}

/**
 * Extracts text from an image using OCR via Supabase Edge Function
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    console.log('Starting text extraction from image:', imageFile.name);
    
    // Create a FormData object to send the image
    const formData = new FormData();
    formData.append('image', imageFile);
    
    console.log('Calling OCR function with image:', imageFile.name, 'size:', imageFile.size, 'type:', imageFile.type);
    
    // Get the current session
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    
    console.log('Auth token available:', !!accessToken);
    
    // Call the Supabase Edge Function for OCR - directly with fetch instead of supabase.functions.invoke
    // to have more control over the headers and request format
    const response = await fetch(
      'https://ykleosfvtqcmqxqihnod.supabase.co/functions/v1/ocr-extract-text',
      {
        method: 'POST',
        body: formData,
        headers: {
          // Set the Authorization header properly - using the API key for public access
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'apikey': supabase.supabaseKey,
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response from OCR function:', response.status, errorData);
      throw new Error(`OCR-Service hat mit Status ${response.status} geantwortet: ${errorData.error || 'Unbekannter Fehler'}`);
    }
    
    const functionData = await response.json();
    console.log('OCR function response:', functionData);
    
    if (!functionData) {
      console.error('No data returned from OCR function');
      throw new Error('Keine Daten vom OCR-Service erhalten');
    }
    
    if (functionData.error) {
      console.error('OCR function error:', functionData.error);
      throw new Error(functionData.error);
    }
    
    const extractedText = functionData?.text || '';
    
    if (!extractedText || extractedText.trim() === '') {
      console.warn('No text extracted from image');
      throw new Error('Aus dem Bild konnte kein Text extrahiert werden');
    }
    
    console.log('Extracted text from image:', extractedText);
    return extractedText;
  } catch (error) {
    console.error('Error in extractTextFromImage:', error);
    throw error;
  }
}

/**
 * Analyzes the extracted text to identify event details
 */
export async function analyzeEventText(text: string): Promise<ExtractedEventData> {
  if (!text || text.trim() === '') {
    console.log('No text provided for analysis');
    return {};
  }
  
  try {
    console.log('Analyzing extracted text:', text);
    
    // Call the Supabase Edge Function for AI text analysis
    const { data, error } = await supabase.functions.invoke(
      'analyze-event-text',
      {
        body: { text },
      }
    );
    
    if (error) {
      console.error('Error analyzing text:', error);
      throw new Error(error.message);
    }
    
    console.log('Text analysis response:', data);
    
    if (!data) {
      console.error('No data returned from text analysis function');
      throw new Error('Keine Daten vom Textanalyse-Service erhalten');
    }
    
    console.log('Text analysis result:', data);
    return data as ExtractedEventData;
  } catch (error) {
    console.error('Error in analyzeEventText:', error);
    throw error;
  }
}

/**
 * Process an image to extract event data
 * Combines OCR and text analysis
 */
export async function processEventImage(file: File): Promise<ExtractedEventData> {
  try {
    console.log('Starting image processing for:', file.name);
    
    toast({
      title: "Bild wird analysiert",
      description: "Das Bild wird verarbeitet, um Eventdaten zu extrahieren...",
    });
    
    // Step 1: Extract text from the image
    const extractedText = await extractTextFromImage(file);
    console.log('Extracted text from image:', extractedText);
    
    if (!extractedText) {
      toast({
        title: "Keine Textinformationen gefunden",
        description: "Aus dem Bild konnte kein Text extrahiert werden.",
        variant: "destructive"
      });
      return {};
    }
    
    // Step 2: Analyze the text to find event details
    const eventData = await analyzeEventText(extractedText);
    console.log('Extracted event data:', eventData);
    
    // Show success toast if we found some data
    if (Object.keys(eventData).length > 0) {
      toast({
        title: "Eventdaten erkannt",
        description: "Die Daten wurden aus dem Bild extrahiert.",
        variant: "success"
      });
    } else {
      toast({
        title: "Keine Eventdaten erkannt",
        description: "Es konnten keine Eventdaten aus dem Text extrahiert werden.",
        variant: "destructive"
      });
    }
    
    // Return the extracted data
    return eventData;
  } catch (error) {
    console.error('Error processing event image:', error);
    toast({
      title: "Fehler bei der Bildanalyse",
      description: error instanceof Error ? error.message : "Ein unerwarteter Fehler ist aufgetreten.",
      variant: "destructive"
    });
    return {};
  }
}
