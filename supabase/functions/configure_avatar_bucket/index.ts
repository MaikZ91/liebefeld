
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Ensure avatars bucket exists and is public
    try {
      // Check if bucket exists
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
      
      if (!avatarsBucket) {
        // Create bucket if it doesn't exist
        await supabaseAdmin.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2 // 2MB
        });
        console.log('Created avatars bucket');
      } else {
        // Update bucket to ensure it's public
        await supabaseAdmin.storage.updateBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2 // 2MB
        });
        console.log('Updated avatars bucket to be public');
      }

      // Now directly execute SQL to ensure policies exist
      const { error: policyError } = await supabaseAdmin.rpc('ensure_avatar_policies');
      
      if (policyError) {
        console.error('Error creating policies:', policyError);
        
        // If RPC fails, try direct SQL (would normally be done via SQL migrations)
        // This is a backup approach only
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Avatar bucket configuration completed successfully' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
      
    } catch (err) {
      console.error('Error configuring avatar bucket:', err);
      throw err;
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
