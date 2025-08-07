
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushTokenRow {
  token: string;
  created_at: string;
  updated_at: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the FCM Server Key from environment
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    if (!fcmServerKey) {
      console.error('FCM_SERVER_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'FCM_SERVER_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('FCM_SERVER_KEY found, length:', fcmServerKey.length);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const { sender, text, message_id } = await req.json();
    
    console.log('Processing push notification for message:', message_id);
    console.log('Sender:', sender, 'Text:', text);

    // Get all push tokens from database
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token');

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log('No push tokens found');
      return new Response(
        JSON.stringify({ message: 'No push tokens found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${tokens.length} push tokens`);

    // Send push notification to each token
    let successCount = 0;
    let failureCount = 0;
    const errorDetails = [];

    for (const tokenRow of tokens as PushTokenRow[]) {
      try {
        const pushPayload = {
          to: tokenRow.token,
          notification: {
            title: sender,
            body: text,
            icon: '/icon-192.svg'
          }
        };

        console.log('Sending push to token:', tokenRow.token.substring(0, 20) + '...');
        console.log('Using FCM URL: https://fcm.googleapis.com/fcm/send');
        console.log('Authorization header starts with:', `key=${fcmServerKey.substring(0, 10)}...`);

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmServerKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pushPayload)
        });

        console.log('FCM Response status:', response.status);
        console.log('FCM Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('FCM Response body (first 200 chars):', responseText.substring(0, 200));

        let result;
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse FCM response as JSON:', parseError);
          console.error('Response was:', responseText);
          errorDetails.push({
            token: tokenRow.token.substring(0, 20) + '...',
            error: 'Invalid JSON response from FCM',
            response: responseText.substring(0, 100)
          });
          failureCount++;
          continue;
        }
        
        if (response.ok && result.success === 1) {
          console.log('Push sent successfully to token:', tokenRow.token.substring(0, 20) + '...');
          successCount++;
        } else {
          console.error('Failed to send push to token:', tokenRow.token.substring(0, 20) + '...', result);
          failureCount++;
          errorDetails.push({
            token: tokenRow.token.substring(0, 20) + '...',
            error: result.results?.[0]?.error || result.error || 'Unknown error',
            response: result
          });
          
          // If token is invalid, remove it from database
          if (result.results?.[0]?.error === 'InvalidRegistration' || result.results?.[0]?.error === 'NotRegistered') {
            console.log('Removing invalid token from database');
            await supabase
              .from('push_tokens')
              .delete()
              .eq('token', tokenRow.token);
          }
        }
      } catch (error) {
        console.error('Error sending push to token:', tokenRow.token.substring(0, 20) + '...', error);
        failureCount++;
        errorDetails.push({
          token: tokenRow.token.substring(0, 20) + '...',
          error: error.message || 'Network error',
          details: error
        });
      }
    }

    console.log(`Push notifications sent. Success: ${successCount}, Failures: ${failureCount}`);

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications processed',
        sent: successCount,
        failed: failureCount,
        total_tokens: tokens.length,
        error_details: errorDetails.slice(0, 5), // Limit to first 5 errors for debugging
        fcm_key_configured: !!fcmServerKey,
        fcm_key_length: fcmServerKey?.length || 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
