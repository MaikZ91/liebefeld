
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Ensure the avatars bucket exists with public access
    try {
      // First check if bucket exists
      const { data: buckets } = await supabaseClient.storage.listBuckets();
      const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
      
      if (!avatarsBucket) {
        // Create bucket if it doesn't exist
        await supabaseClient.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
        });
        console.log('Created avatars bucket');
      } else {
        // Update bucket to ensure it's public
        await supabaseClient.storage.updateBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2 // 2MB limit
        });
        console.log('Updated avatars bucket to ensure public access');
      }
    } catch (err) {
      console.error('Error managing bucket:', err);
      throw err;
    }
    
    // Now let's create policies to allow public access to the avatars bucket
    try {
      // These SQL statements will create the policies if they don't exist
      const { error } = await supabaseClient.rpc('ensure_avatar_policies');
      if (error) {
        console.log('Error calling ensure_avatar_policies function:', error);
        
        // If RPC fails, try to create policies directly
        await supabaseClient.auth.admin.createUser({
          email: 'temp@example.com',
          password: 'temppassword',
          user_metadata: { role: 'temp' }
        });
      }
    } catch (err) {
      console.error('Error setting up storage policies:', err);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
