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
    console.log('Starte das Posten der wöchentlichen Community-Nachrichten...');

    // 1. Nachrichten-Inhalte definieren
    const kennenlernabendMessageContent = `TRIBE Kennenlernabend
🗓️ **Jeden Sonntag**

Lust auf neue Leute, echte Gespräche und gemeinsame Ideen? Ob einfach quatschen, kreative Projekte planen oder zukünftige Treffen – beim TRIBE-Abend findet ihr Raum dafür.

Lasst uns den Sonntagabend gemeinsam gestalten! Findet euch in der Stadt zusammen und sichert euch einen gemütlichen Platz, wo immer es euch passt. Wer hat Lust, dabei zu sein und sich um die Koordination zu kümmern? 👍 unter diese Nachricht, um euch abzustimmen!`; // Kennenlernabend message

    const wandersamstagMessageContent = `TRIBE Wandersamstag
🗓️ Jeden letzten Samstag im Monat

Packt eure Rucksäcke und schnürt die Schuhe! Lust auf frische Luft, neue Wege und gute Gespräche in der Natur? Der TRIBE Wandersamstag ist eure Gelegenheit, gemeinsam die Umgebung zu erkunden und neue Leute kennenzulernen.

Lasst uns den Wandersamstag gemeinsam gestalten! Findet euch zusammen und stimmt eine schöne Route ab. Wer ist dabei und hat Lust, eine Wanderung zu organisieren? 👍 unter diese Nachricht, um euch abzustimmen!`; // Wandersamstag message

    // 2. Relevante Gruppen abrufen (Gruppen, deren ID auf '_ausgehen' ODER '_sport' enden)
    const { data: relevantGroups, error: groupsError } = await supabase
      .from('chat_groups')
      .select('id, name')
      .or('id.like.%_ausgehen,id.like.%_sport'); // Filtert nach Gruppen, die auf '_ausgehen' ODER '_sport' enden

    if (groupsError) {
      console.error('Fehler beim Abrufen der relevanten Gruppen:', groupsError);
      throw new Error(`Fehler beim Abrufen der Gruppen: ${groupsError.message}`);
    }

    if (!relevantGroups || relevantGroups.length === 0) {
      console.log('Keine relevanten Gruppen gefunden, an die Nachrichten gepostet werden können.');
      return new Response(
        JSON.stringify({ success: true, message: 'Keine relevanten Gruppen gefunden.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let successCount = 0;
    let errorCount = 0;

    // 3. Nachricht an jede Gruppe posten, basierend auf der Kategorie, die aus der ID abgeleitet wird
    for (const group of relevantGroups) {
      let messageToPost = '';
      let groupCategory = '';

      if (group.id.endsWith('_ausgehen')) {
        messageToPost = kennenlernabendMessageContent;
        groupCategory = 'Ausgehen';
      } else if (group.id.endsWith('_sport')) {
        messageToPost = wandersamstagMessageContent;
        groupCategory = 'Sport';
      } else {
        // Falls eine Gruppe gefunden wird, die nicht '_ausgehen' oder '_sport' ist (z.B. neue Kategorien)
        console.warn(`Gruppe ${group.id} passt zu keiner bekannten Kategorie (_ausgehen oder _sport), überspringe.`);
        continue; // Diese Gruppe überspringen
      }

      try {
        const { error: insertError } = await supabase
          .from('chat_messages')
          .insert({
            group_id: group.id,
            sender: 'TRIBE Bot', // Der Absender der Nachricht
            avatar: 'https://cdn.jsdelivr.net/gh/MaikZ91/productiontools/bot_avatar.png', // Ein Platzhalter-Avatar
            text: messageToPost,
            read_by: [] // Die Bot-Nachricht ist zunächst von niemandem gelesen
          });

        if (insertError) {
          console.error(`Fehler beim Posten der Nachricht an Gruppe ${group.id} (${group.name}) [Kategorie: ${groupCategory}]:`, insertError);
          errorCount++;
        } else {
          successCount++;
          console.log(`Nachricht erfolgreich an Gruppe ${group.name} [Kategorie: ${groupCategory}] gepostet.`);
        }
      } catch (postError) {
        console.error(`Ausnahme beim Posten der Nachricht an Gruppe ${group.id}:`, postError);
        errorCount++;
      }
    }

    console.log(`Posten der Community-Nachrichten abgeschlossen: ${successCount} erfolgreich, ${errorCount} Fehler`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Wöchentliche Community-Nachrichten an ${successCount} Gruppen gepostet.`,
        errors: errorCount,
        totalGroups: relevantGroups.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Fehler in der Edge Function zum Posten der Community-Nachrichten:', error);
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