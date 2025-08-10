import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { importPKCS8, SignJWT } from 'https://esm.sh/jose@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Firebase Project ID fest eintragen
const projectId = 'the-tribe-bi';

// ---- OAuth2 Access Token aus Service Account für FCM v1 holen ----
async function getAccessToken(): Promise<string> {
  const saJson = Deno.env.get('FCM_SERVICE_ACCOUNT');
  if (!saJson) throw new Error('FCM_SERVICE_ACCOUNT not set in ENV');
  const sa = JSON.parse(saJson);
  if (!sa.private_key || !sa.client_email) {
    throw new Error('Service account JSON missing private_key or client_email');
  }

  const privateKey = await importPKCS8(sa.private_key, 'RS256');

  const jwt = await new SignJWT({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token'
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const raw = await resp.text();
  let data: any;
  try { data = JSON.parse(raw); } catch { throw new Error(`Token JSON parse failed: ${raw}`); }
  if (!resp.ok) throw new Error(`Token fetch failed ${resp.status}: ${raw}`);
  if (!data.access_token) throw new Error('No access_token in token response');
  return data.access_token as string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Request-Body
    let payload: any = {};
    try { payload = await req.json(); } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const sender = typeof payload?.sender === 'string' ? payload.sender : 'TRIBE';
    const text = typeof payload?.text === 'string' ? payload.text : '';
    const message_id = payload?.message_id ?? null;

    // Resolve sender/text from DB if missing and message_id is provided
    let finalSender = (sender || 'TRIBE').toString().trim() || 'TRIBE';
    let finalText = (text || '').toString().trim();

    if ((!finalText || finalText.length === 0) && message_id) {
      const { data: msgRow, error: msgErr } = await supabase
        .from('chat_messages')
        .select('sender, text, event_title')
        .eq('id', message_id)
        .maybeSingle();

      if (!msgErr && msgRow) {
        finalSender = (msgRow.sender || finalSender).toString();
        finalText = (msgRow.text || (msgRow.event_title ? `Neues Event: ${msgRow.event_title}` : finalText)).toString();
      }
    }

    if (!finalText || finalText.length === 0) {
      finalText = 'Neue Nachricht';
    }

    // Tokens holen
    const { data: tokens, error: tokensError } = await supabase
      .from('push_tokens')
      .select('token');

    if (tokensError) {
      console.error('Error fetching push tokens:', tokensError);
      return new Response(JSON.stringify({ error: 'Failed to fetch push tokens' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!tokens?.length) {
      return new Response(JSON.stringify({ message: 'No push tokens found', sent: 0, failed: 0, total_tokens: 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Access Token holen (v1)
    const accessToken = await getAccessToken();
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    let successCount = 0;
    let failureCount = 0;
    const errorDetails: Array<Record<string, any>> = [];

    // Senden
    for (const row of tokens) {
      const token: string = (row as any).token;
      try {
        const v1Payload = {
          message: {
            token,
            notification: { title: finalSender, body: finalText },
            data: {
              message_id: String(message_id ?? ''),
              sender: finalSender,
              text: finalText,
              link: '/chat?view=community'
            },
            webpush: {
              notification: {
                title: finalSender,
                body: finalText,
                icon: '/icon-192.svg',
                badge: '/icon-192.svg'
              },
              fcmOptions: {
                link: 'https://liebefeld.lovable.app/chat?view=community'
              }
            }
          }
        };

        const resp = await fetch(fcmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(v1Payload)
        });

        const raw = await resp.text();
        let parsed: any;
        try { parsed = JSON.parse(raw); } catch { parsed = { non_json: true, raw }; }

        if (!resp.ok) {
          failureCount++;
          const code = parsed?.error?.status || parsed?.error?.message || 'Unknown FCM v1 error';
          errorDetails.push({
            token: token.slice(0, 24) + '...',
            error: code,
            details: parsed?.error ?? parsed
          });

          // Häufige invalid Token-Hinweise: UNREGISTERED / INVALID_ARGUMENT
          const blob = JSON.stringify(parsed);
          if (blob.includes('UNREGISTERED') || blob.includes('INVALID_ARGUMENT')) {
            try {
              await supabase.from('push_tokens').delete().eq('token', token);
            } catch (_e) { /* ignore */ }
          }
          continue;
        }

        // Erfolg
        successCount++;
      } catch (err: any) {
        failureCount++;
        errorDetails.push({
          token: token.slice(0, 24) + '...',
          error: err?.message || 'Network error'
        });
      }
    }

    return new Response(JSON.stringify({
      message: 'Push notifications processed (v1)',
      sent: successCount,
      failed: failureCount,
      total_tokens: tokens.length,
      error_details: errorDetails.slice(0, 10),
      meta: { projectId, message_id }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-push function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error?.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
