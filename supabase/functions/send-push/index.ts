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

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Authorization': `key=${fcmServerKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pushPayload)
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log('Push sent successfully to token:', tokenRow.token.substring(0, 20) + '...');
          successCount++;
        } else {
          console.error('Failed to send push to token:', tokenRow.token.substring(0, 20) + '...', result);
          failureCount++;
          
          // If token is invalid, you might want to remove it from database
          if (result.error === 'InvalidRegistration' || result.error === 'NotRegistered') {
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
      }
    }

    console.log(`Push notifications sent. Success: ${successCount}, Failures: ${failureCount}`);

    return new Response(
      JSON.stringify({ 
        message: 'Push notifications processed',
        sent: successCount,
        failed: failureCount,
        total_tokens: tokens.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});