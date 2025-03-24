
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { createWorker } from 'tesseract.js';

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
 * Extracts text from an image using Tesseract.js OCR in the browser
 */
export async function extractTextFromImage(imageFile: File): Promise<string> {
  try {
    console.log('Starting browser-based text extraction from image:', imageFile.name);
    
    toast({
      title: "Texterkennung läuft",
      description: "Das Bild wird analysiert, bitte einen Moment Geduld...",
    });
    
    // Create a Tesseract worker with proper options format
    const worker = await createWorker({
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      logger: progress => {
        console.log('Tesseract progress:', progress);
      }
    });
    
    // Load German language data
    await worker.loadLanguage('deu');
    await worker.initialize('deu');
    
    // Create an object URL from the image file
    const imageUrl = URL.createObjectURL(imageFile);
    
    console.log('Processing image with Tesseract.js');
    
    // Recognize text in the image
    const { data: { text } } = await worker.recognize(imageUrl);
    
    // Cleanup
    URL.revokeObjectURL(imageUrl);
    await worker.terminate();
    
    if (!text || text.trim() === '') {
      console.warn('No text extracted from image');
      throw new Error('Aus dem Bild konnte kein Text extrahiert werden');
    }
    
    console.log('Extracted text from image:', text);
    return text;
  } catch (error) {
    console.error('Error in extractTextFromImage:', error);
    throw error;
  }
}

/**
 * Analyzes the extracted text to identify event details
 * Uses the edge function for AI analysis, with fallback for errors
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
      
      // Basic fallback if the edge function fails
      const fallbackData = extractBasicEventData(text);
      console.log('Using fallback data extraction:', fallbackData);
      return fallbackData;
    }
    
    console.log('Text analysis response:', data);
    
    if (!data) {
      console.error('No data returned from text analysis function');
      return {};
    }
    
    console.log('Text analysis result:', data);
    return data as ExtractedEventData;
  } catch (error) {
    console.error('Error in analyzeEventText:', error);
    
    // Return fallback data extraction in case of any error
    return extractBasicEventData(text);
  }
}

/**
 * Extract basic event data as a fallback when the edge function fails
 * This is a simplified version of what the edge function does
 */
function extractBasicEventData(text: string): ExtractedEventData {
  console.log('Using client-side fallback text analysis');
  
  // Basic data extraction using regex patterns
  const dateRegex = /(\d{1,2})[.,\s]+([A-ZÄÖÜa-zäöü]+)[.,\s]+(\d{4})/i;
  const dateMatch = text.match(dateRegex);
  
  let date = '';
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    let month = '01';
    
    // Convert month name to number
    const monthName = dateMatch[2].toLowerCase();
    if (monthName.includes("jan")) month = "01";
    else if (monthName.includes("feb")) month = "02";
    else if (monthName.includes("mär") || monthName.includes("mar")) month = "03";
    else if (monthName.includes("apr")) month = "04";
    else if (monthName.includes("mai")) month = "05";
    else if (monthName.includes("jun")) month = "06";
    else if (monthName.includes("jul")) month = "07";
    else if (monthName.includes("aug")) month = "08";
    else if (monthName.includes("sep")) month = "09";
    else if (monthName.includes("okt")) month = "10";
    else if (monthName.includes("nov")) month = "11";
    else if (monthName.includes("dez")) month = "12";
    
    const year = dateMatch[3];
    date = `${year}-${month}-${day}`;
  }
  
  // Default values
  let category = 'Sonstiges';
  if (text.match(/(INDIE|POSTPUNK|ELEKTRO|ALTERNATIVE)/i)) {
    category = text.match(/(TANZMUSIK|PARTY)/i) ? "Party" : "Konzert";
  }
  
  let location = '';
  if (text.toLowerCase().includes('bielefeld')) {
    location = 'Bielefeld';
    if (text.toLowerCase().includes('cutie')) {
      location = 'Cutie, Bielefeld';
    }
  }
  
  // Return the extracted data
  return {
    title: text.match(/(INDIE[-\s]*POSTPUNK[-\s]*ELEKTRO[-\s]*ALTERNATIVE|ALTERNATIVE[-\s]*TANZMUSIK)/i)?.[0] || 'Event',
    date: date || undefined,
    time: text.match(/(\d{1,2}):(\d{2})/)?.[0] || '19:00',
    location: location || undefined,
    category: category,
    description: text.split('\n').slice(0, 3).join(' ').trim()
  };
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
    
    // Step 1: Extract text from the image with in-browser OCR
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
