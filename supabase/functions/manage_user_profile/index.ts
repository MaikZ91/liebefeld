
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Parse request body
    const { action, profile } = await req.json();

    // Different actions based on the request
    switch (action) {
      case 'getProfile':
        return await getProfile(supabaseClient, profile.username);
      case 'createOrUpdateProfile':
        return await createOrUpdateProfile(supabaseClient, profile);
      case 'updateLastOnline':
        return await updateLastOnline(supabaseClient, profile.username);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Get user profile by username
async function getProfile(supabaseClient, username) {
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }

  return new Response(
    JSON.stringify({ profile: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  );
}

// Create or update user profile
async function createOrUpdateProfile(supabaseClient, profile) {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabaseClient
      .from('user_profiles')
      .select('id')
      .eq('username', profile.username)
      .maybeSingle();

    let result;

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .update({
          avatar: profile.avatar,
          interests: profile.interests || [],
          favorite_locations: profile.favorite_locations || [],
          last_online: new Date().toISOString()
        })
        .eq('username', profile.username)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .insert({
          username: profile.username,
          avatar: profile.avatar || null,
          interests: profile.interests || [],
          favorite_locations: profile.favorite_locations || [],
          last_online: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return new Response(
      JSON.stringify({ profile: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in createOrUpdateProfile:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}

// Update last online timestamp
async function updateLastOnline(supabaseClient, username) {
  try {
    const { error } = await supabaseClient
      .from('user_profiles')
      .update({ last_online: new Date().toISOString() })
      .eq('username', username);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error updating last online status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
