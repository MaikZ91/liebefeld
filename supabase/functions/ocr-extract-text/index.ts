
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
    const formData = await req.formData();
    const image = formData.get('image');
    
    if (!image || !(image instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No image provided or invalid image' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get the Vision API key from environment variables
    const VISION_API_KEY = Deno.env.get('VISION_API_KEY');
    if (!VISION_API_KEY) {
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

    // Extract the OCR text from the response
    const textAnnotations = visionData?.responses?.[0]?.textAnnotations;
    const extractedText = textAnnotations?.[0]?.description || '';

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
