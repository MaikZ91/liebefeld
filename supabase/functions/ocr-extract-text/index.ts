
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("OCR function called");
    
    // Log request content type and headers for debugging
    console.log("Request Content-Type:", req.headers.get("content-type"));
    
    // Special handling for multipart/form-data
    if (!req.headers.get("content-type")?.includes("multipart/form-data")) {
      console.error("Invalid content type. Expected multipart/form-data");
      return new Response(
        JSON.stringify({ error: 'Invalid content type. Expected multipart/form-data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const formData = await req.formData().catch(err => {
      console.error("Failed to parse form data:", err);
      return null;
    });
    
    if (!formData) {
      console.error("Failed to parse form data");
      return new Response(
        JSON.stringify({ error: 'Failed to parse form data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const image = formData.get('image');
    
    if (!image || !(image instanceof File)) {
      console.error("No image provided or invalid image");
      return new Response(
        JSON.stringify({ error: 'No image provided or invalid image' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Processing image: ${image.name}, size: ${image.size} bytes, type: ${image.type}`);

    // Get the Vision API key from environment variables
    const VISION_API_KEY = Deno.env.get('VISION_API_KEY');
    if (!VISION_API_KEY) {
      console.error("Vision API key not configured");
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Convert the image to base64
    const arrayBuffer = await image.arrayBuffer();
    const base64Image = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );
    
    console.log("Image converted to base64, calling Vision API");

    // Call Google Cloud Vision API for OCR
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 50,  // Increased from 10 to 50
                },
              ],
            },
          ],
        }),
      }
    );

    const visionData = await visionResponse.json();
    
    if (!visionResponse.ok) {
      console.error('Vision API error:', visionData);
      return new Response(
        JSON.stringify({ error: 'Error processing image with Vision API', details: visionData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log("Vision API response received:", JSON.stringify(visionData).substring(0, 200) + "...");

    // Extract the OCR text from the response
    const textAnnotations = visionData?.responses?.[0]?.textAnnotations;
    
    if (!textAnnotations || textAnnotations.length === 0) {
      console.warn("No text annotations found in Vision API response");
      return new Response(
        JSON.stringify({ text: '', warning: 'No text was detected in the image' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const extractedText = textAnnotations[0]?.description || '';
    
    console.log("Extracted text:", extractedText);

    if (!extractedText) {
      console.warn("No text was extracted from the image");
      return new Response(
        JSON.stringify({ text: '', warning: 'No text was detected in the image' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ text: extractedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in OCR function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
