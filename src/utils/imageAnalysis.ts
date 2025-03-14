
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
    // Create a FormData object to send the image
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Call the Supabase Edge Function for OCR
    const { data: functionData, error: functionError } = await supabase.functions.invoke(
      'ocr-extract-text',
      {
        body: formData,
      }
    );
    
    if (functionError) {
      console.error('Error extracting text from image:', functionError);
      throw new Error(functionError.message);
    }
    
    return functionData?.text || '';
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
    return {};
  }
  
  try {
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
    toast({
      title: "Bild wird analysiert",
      description: "Das Bild wird verarbeitet, um Eventdaten zu extrahieren...",
    });
    
    // Step 1: Extract text from the image
    const extractedText = await extractTextFromImage(file);
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
