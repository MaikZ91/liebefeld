// supabase/functions/post-weekly-meetup-message/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS-Preflight-Anfragen behandeln
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('Starte das Posten der wöchentlichen Kennenlernabend-Nachricht...');

    // Die Nachricht, die gepostet werden soll
    const messageContent = `TRIBE Kennenlernabend
🗓️ **Jeden Sonntag**

Lust auf neue Leute, echte Gespräche und gemeinsame Ideen? Ob einfach quatschen, kreative Projekte planen oder zukünftige Treffen – beim TRIBE-Abend findet ihr Raum dafür.

**Lasst uns den Samstagabend gemeinsam gestalten! Findet euch in der Stadt zusammen und sichert euch einen gemütlichen Platz, wo immer es euch passt. Wer hat Lust, dabei zu sein und sich um die Koordination zu kümmern? 👍 unter diese Nachricht, um euch abzustimmen!**`;

    // 1. Alle "Ausgehen"-Gruppen abrufen
    // Die Gruppen-IDs enden typischerweise auf '_ausgehen' (z.B. 'bi_ausgehen', 'berlin_ausgehen')
    const { data: outgoingGroups, error: groupsError } = await supabase
      .from('chat_groups')
      .select('id, name')
      .like('id', '%_ausgehen'); // Filtert nach IDs, die auf '_ausgehen' enden

    if (groupsError) {
      console.error('Fehler beim Abrufen der "Ausgehen"-Gruppen:', groupsError);
      throw new Error(`Fehler beim Abrufen der Gruppen: ${groupsError.message}`);
    }

    if (!outgoingGroups || outgoingGroups.length === 0) {
      console.log('Keine "Ausgehen"-Gruppen gefunden, an die eine Nachricht gepostet werden kann.');
      return new Response(
        JSON.stringify({ success: true, message: 'Keine "Ausgehen"-Gruppen gefunden.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let successCount = 0;
    let errorCount = 0;

    // 2. Die Nachricht an jede "Ausgehen"-Gruppe posten
    for (const group of outgoingGroups) {
      try {
        const { error: insertError } = await supabase
          .from('chat_messages')
          .insert({
            group_id: group.id,
            sender: 'TRIBE Bot', // Der Absender der Nachricht
            avatar: 'https://cdn.jsdelivr.net/gh/MaikZ91/productiontools/bot_avatar.png', // Ein Platzhalter-Avatar
            text: messageContent,
            read_by: [] // Die Bot-Nachricht ist zunächst von niemandem gelesen
          });

        if (insertError) {
          console.error(`Fehler beim Posten der Nachricht an Gruppe ${group.id} (${group.name}):`, insertError);
          errorCount++;
        } else {
          successCount++;
          console.log(`Nachricht erfolgreich an Gruppe ${group.name} gepostet.`);
        }
      } catch (postError) {
        console.error(`Ausnahme beim Posten der Nachricht an Gruppe ${group.id}:`, postError);
        errorCount++;
      }
    }

    console.log(`Posten der wöchentlichen Kennenlernabend-Nachricht abgeschlossen: ${successCount} erfolgreich, ${errorCount} Fehler.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Wöchentliche Kennenlernabend-Nachricht an ${successCount} "Ausgehen"-Gruppen gepostet.`,
        errors: errorCount,
        totalGroups: outgoingGroups.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Fehler in der Edge Function zum Posten der wöchentlichen Kennenlernabend-Nachricht:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
