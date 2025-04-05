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
    
    // Use recognize method without problematic options
    const { data: { text } } = await worker.recognize(imageUrl);
    
    // Cleanup
    URL.revokeObjectURL(imageUrl);
    await worker.terminate();
    
    if (!text || text.trim() === '') {
      console.warn('No text extracted from image');
      
      // Try again with enhanced image processing
      return await enhancedImageExtraction(imageFile);
    }
    
    console.log('Extracted text from image:', text);
    return text;
  } catch (error) {
    console.error('Error in extractTextFromImage:', error);
    
    // Fallback to enhanced extraction on error
    return await enhancedImageExtraction(imageFile);
  }
}

/**
 * Enhanced image extraction with preprocessing for better OCR results
 */
async function enhancedImageExtraction(imageFile: File): Promise<string> {
  try {
    console.log('Attempting enhanced image extraction with preprocessing');
    
    toast({
      title: "Erweiterte Texterkennung",
      description: "Versuche mit Bildoptimierung, bitte warten...",
    });
    
    // Create a worker with enhanced settings
    const worker = await createWorker({
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      logger: progress => {
        console.log('Enhanced Tesseract progress:', progress);
      }
    });
    
    // Load German language data and set configurations
    await worker.loadLanguage('deu');
    await worker.initialize('deu');
    
    // Load and preprocess the image using canvas
    const preprocessedImageUrl = await preprocessImage(imageFile);
    
    console.log('Processing preprocessed image with Tesseract.js');
    
    // Use recognize method with compatible options
    const { data: { text } } = await worker.recognize(preprocessedImageUrl);
    
    // Cleanup
    URL.revokeObjectURL(preprocessedImageUrl);
    await worker.terminate();
    
    if (!text || text.trim() === '') {
      console.warn('No text extracted from enhanced image processing');
      throw new Error('Aus dem Bild konnte kein Text extrahiert werden');
    }
    
    console.log('Extracted text from enhanced image:', text);
    return text;
  } catch (error) {
    console.error('Error in enhancedImageExtraction:', error);
    throw error;
  }
}

/**
 * Preprocess the image to improve OCR results using canvas
 */
async function preprocessImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    image.onload = () => {
      try {
        // Set canvas dimensions
        let width = image.width;
        let height = image.height;
        
        // Resize very large images to improve processing
        const MAX_DIMENSION = 2048;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.floor(height * (MAX_DIMENSION / width));
            width = MAX_DIMENSION;
          } else {
            width = Math.floor(width * (MAX_DIMENSION / height));
            height = MAX_DIMENSION;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw original image
        ctx.drawImage(image, 0, 0, width, height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Apply image processing for better OCR:
        // 1. Convert to grayscale
        // 2. Increase contrast
        // 3. Threshold to black and white
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          
          // Apply threshold for black and white (increase contrast)
          const threshold = 180;
          const val = gray > threshold ? 255 : 0;
          
          data[i] = val;     // R
          data[i + 1] = val; // G
          data[i + 2] = val; // B
          // Keep alpha channel as is (data[i+3])
        }
        
        // Put the modified image data back on the canvas
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to dataURL and resolve
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (err) {
        console.error('Error preprocessing image:', err);
        reject(err);
      }
    };
    
    image.onerror = (err) => {
      console.error('Error loading image for preprocessing:', err);
      reject(err);
    };
    
    // Load image from file
    image.src = URL.createObjectURL(file);
  });
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
    
    // Try to analyze with the Supabase Edge Function if available
    try {
      const { data, error } = await supabase.functions.invoke(
        'analyze-event-text',
        {
          body: { text },
        }
      );
      
      if (!error && data) {
        console.log('Text analysis response from edge function:', data);
        return data as ExtractedEventData;
      }
    } catch (edgeFunctionError) {
      console.error('Edge function error, using fallback:', edgeFunctionError);
      // Continue to fallback
    }
    
    // If edge function fails or isn't available, use fallback
    const fallbackData = extractBasicEventData(text);
    console.log('Using fallback data extraction:', fallbackData);
    return fallbackData;
  } catch (error) {
    console.error('Error in analyzeEventText:', error);
    
    // Return fallback data extraction in case of any error
    return extractBasicEventData(text);
  }
}

/**
 * Extract basic event data as a fallback when the edge function fails
 * Enhanced to better extract information from typical event flyers
 */
function extractBasicEventData(text: string): ExtractedEventData {
  console.log('Using client-side fallback text analysis');
  
  // Normalize text for better matching (remove extra spaces, convert to lowercase)
  const normalizedText = text.replace(/\s+/g, ' ').toLowerCase();
  
  // Extract date with improved regex patterns
  let date = '';
  
  // Pattern 1: DD.MM.YYYY or DD-MM-YYYY
  const dateRegex1 = /(\d{1,2})[\.-](\d{1,2})[\.-](\d{2,4})/i;
  const dateMatch1 = normalizedText.match(dateRegex1);
  
  // Pattern 2: DD Month YYYY (e.g., "23 August 2023" or "23. August 2023")
  const monthNames = [
    'januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 
    'august', 'september', 'oktober', 'november', 'dezember'
  ];
  const monthPattern = monthNames.join('|');
  const dateRegex2 = new RegExp(`(\\d{1,2})\\s*\\.?\\s*(${monthPattern})\\s*,?\\s*(\\d{2,4})`, 'i');
  const dateMatch2 = normalizedText.match(dateRegex2);
  
  if (dateMatch1) {
    // Format from DD.MM.YYYY
    const day = dateMatch1[1].padStart(2, '0');
    const month = dateMatch1[2].padStart(2, '0');
    const year = dateMatch1[3].length === 2 ? `20${dateMatch1[3]}` : dateMatch1[3];
    date = `${year}-${month}-${day}`;
  } else if (dateMatch2) {
    // Format from DD Month YYYY
    const day = dateMatch2[1].padStart(2, '0');
    const monthName = dateMatch2[2].toLowerCase();
    let month = '01';
    
    // Convert month name to number
    for (let i = 0; i < monthNames.length; i++) {
      if (monthName.includes(monthNames[i])) {
        month = (i + 1).toString().padStart(2, '0');
        break;
      }
    }
    
    const year = dateMatch2[3].length === 2 ? `20${dateMatch2[3]}` : dateMatch2[3];
    date = `${year}-${month}-${day}`;
  } else {
    // Try to find any date-like patterns
    const anyDateRegex = /(\d{1,2})[-\.\/\s](\d{1,2}|\w+)[-\.\/\s](\d{2,4})/i;
    const anyDateMatch = normalizedText.match(anyDateRegex);
    
    if (anyDateMatch) {
      try {
        const parts = anyDateMatch[0].split(/[-\.\/\s]/);
        // Assuming day-month-year format (common in Germany)
        if (parts.length >= 3) {
          let day = parts[0].padStart(2, '0');
          let month = '01';
          let year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          
          // Try to parse the month
          if (/^\d+$/.test(parts[1])) {
            month = parseInt(parts[1]).toString().padStart(2, '0');
          } else {
            // Check if month is a name
            const monthText = parts[1].toLowerCase();
            for (let i = 0; i < monthNames.length; i++) {
              if (monthNames[i].includes(monthText) || monthText.includes(monthNames[i])) {
                month = (i + 1).toString().padStart(2, '0');
                break;
              }
            }
          }
          
          date = `${year}-${month}-${day}`;
        }
      } catch (err) {
        console.error('Error parsing any date match:', err);
      }
    }
  }
  
  // Extract time 
  let time = '';
  const timeRegex = /(\d{1,2})[:\.](\d{2})(?:\s*(?:uhr|h))?/i;
  const timeMatch = normalizedText.match(timeRegex);
  
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, '0');
    const minutes = timeMatch[2].padStart(2, '0');
    time = `${hours}:${minutes}`;
  } else {
    // Fallback time
    time = '19:00';
  }
  
  // Try to determine event category
  let category = 'Sonstiges';
  
  if (normalizedText.match(/(konzert|live\s*musik|band|musik|sängerin|sänger)/i)) {
    category = 'Konzert';
  } else if (normalizedText.match(/(party|feier|tanzen|club|dj|disco|elektronische musik|techno)/i)) {
    category = 'Party';
  } else if (normalizedText.match(/(ausstellung|galerie|kunst|vernissage|exhibition)/i)) {
    category = 'Ausstellung';
  } else if (normalizedText.match(/(sport|training|spiel|match|fitness|yoga|laufen)/i)) {
    category = 'Sport';
  } else if (normalizedText.match(/(workshop|seminar|kurs|lernen|training)/i)) {
    category = 'Workshop';
  } else if (normalizedText.match(/(kultur|theater|lesung|film|kino|festival)/i)) {
    category = 'Kultur';
  }
  
  // Find location
  let location = '';
  
  // Common location indicators
  const locationIndicators = [
    'ort:', 'location:', 'veranstaltungsort:', 'venue:', 'in:', 'at:', '@', 'im', 'am', 'beim'
  ];
  
  for (const indicator of locationIndicators) {
    const regex = new RegExp(`${indicator}\\s+([^,\\.\\n]+)`, 'i');
    const match = normalizedText.match(regex);
    if (match && match[1]) {
      location = match[1].trim();
      break;
    }
  }
  
  // Find title - usually larger text, often at beginning
  // Take first line or first sentence if no clear title found
  let title = '';
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length > 0) {
    // First line is often the title
    title = lines[0].trim();
    
    // If first line is very short, add second line
    if (title.length < 5 && lines.length > 1) {
      title = `${title} ${lines[1].trim()}`;
    }
    
    // If title is too long, truncate it
    if (title.length > 100) {
      title = title.substring(0, 100) + '...';
    }
  } else {
    // Fallback title
    title = 'Event in ' + (location || 'Bielefeld');
  }
  
  // Create a description from the text
  let description = '';
  if (lines.length > 1) {
    // Use a few lines after the title, but not too many
    description = lines.slice(1, Math.min(5, lines.length)).join(' ').trim();
  } else {
    description = text.trim();
  }
  
  // Return the extracted data
  return {
    title: title || 'Event',
    date: date || undefined,
    time: time || '19:00',
    location: location || undefined,
    category: category,
    description: description || undefined
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
