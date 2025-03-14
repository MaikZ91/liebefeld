
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
    
    console.log('OCR extraction result:', functionData);
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
