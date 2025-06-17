// supabase/functions/post-weekly-meetup-message/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('Starte das Posten der wöchentlichen Community-Nachrichten...');

    // Aktuellen Wochentag und Monatstag für die bedingte Posting-Logik ermitteln
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
    const dayOfMonth = today.getDate();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(); // Letzter Tag des aktuellen Monats

    // 1. Nachrichten-Inhalte definieren
    const kennenlernabendMessageContent = `TRIBE Kennenlernabend
🗓️ **Jeden Samstag**

Lust auf neue Leute, echte Gespräche und gemeinsame Ideen? Ob einfach quatschen, kreative Projekte planen oder zukünftige Treffen – beim TRIBE-Abend findet ihr Raum dafür.

Lasst uns den Samstagabend gemeinsam gestalten! Findet euch in der Stadt zusammen und sichert euch einen gemütlichen Platz, wo immer es euch passt. Wer hat Lust, dabei zu sein und sich um die Koordination zu kümmern? 👍 unter diese Nachricht, um euch abzustimmen!`;

    const wandersamstagMessageContent = `TRIBE Wandersamstag
🗓️ Jeden letzten Samstag im Monat

Packt eure Rucksäcke und schnürt die Schuhe! Lust auf frische Luft, neue Wege und gute Gespräche in der Natur? Der TRIBE Wandersamstag ist eure Gelegenheit, gemeinsam die Umgebung zu erkunden und neue Leute kennenzulernen.

Lasst uns den Wandersamstag gemeinsam gestalten! Findet euch zusammen und stimmt eine schöne Route ab. Wer ist dabei und hat Lust, eine Wanderung zu organisieren? 👍 unter diese Nachricht, um euch abzustimmen!`;

    const tuesdayRunMessageContent = `TRIBE Tuesday Run
🗓️ Jeden Dienstag 

Lust auf eine gemeinsame Laufrunde, neue Bestzeiten und gute Gespräche? Schließ dich dem TRIBE Tuesday Run an und starte fit in die Woche! Egal ob Anfänger oder Fortgeschritten – der Spaß steht im Vordergrund.

Finde dich mit anderen Läufern zusammen und entdeckt neue Strecken in der Stadt. Wer ist dabei und hat Lust, eine Laufrunde zu organisieren? 👍 unter diese Nachricht, um euch abzustimmen!`;

     const creativeCircleMessageContent = `TRIBE Creative Circle
🗓️ Jeden letzten Freitag im Monat

Lasst eurer Kreativität freien Lauf! Ob Jammen, Fotowalk, gemeinsame Auftritte oder Malen – der Creative Circle bietet Raum für Austausch, Inspiration und gemeinsame Projekte.

Teilt eure Ideen, findet Mitstreiter und gestaltet unvergessliche Momente. Wer ist dabei und hat Lust, den nächsten Creative Circle zu organisieren? 👍 unter diese Nachricht, um euch abzustimmen!`;

    // 2. Alle relevanten Gruppen abrufen (Ausgehen und Sport)
    const { data: relevantGroups, error: groupsError } = await supabase
      .from('chat_groups')
      .select('id, name')
      .or('id.like.%_ausgehen,id.like.%_sport'); // Holt Gruppen, die auf '_ausgehen' ODER '_sport' enden

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

    // 3. Nachricht an jede Gruppe posten, basierend auf Kategorie und aktuellem Datum
    for (const group of relevantGroups) {
      let messageToPost = '';
      let groupCategory = '';
      let shouldPost = false; // Flag, ob für diese Gruppe in diesem Lauf gepostet werden soll

      if (group.id.endsWith('_ausgehen')) {
        // Kennenlernabend: Annahme ist, dass er wöchentlich gepostet wird, z.B. montags.
        // Wenn es nur am tatsächlichen Samstag gepostet werden soll, müsste der Cron-Job angepasst werden.
        messageToPost = kennenlernabendMessageContent;
        groupCategory = 'Ausgehen';
        if (dayOfWeek === 1) { // Montag
          shouldPost = true;
        } else {
          console.log(`Überspringe Kennenlernabend für ${group.name} - nicht Montag.`);
        }
      } else if (group.id.endsWith('_sport')) {
        groupCategory = 'Sport';
        // Sport-Gruppen: Logik für Wandersamstag oder Tuesday Run
        // Überprüfen, ob es der letzte Samstag im Monat ist
        const isLastSaturdayOfMonth = (dayOfWeek === 6 && (dayOfMonth >= lastDayOfMonth - 6));
        // Überprüfen, ob es Dienstag ist
        const isTuesday = (dayOfWeek === 2);

        if (isLastSaturdayOfMonth) {
          messageToPost = wandersamstagMessageContent;
          shouldPost = true;
          console.log(`Poste Wandersamstag für ${group.name} - ist letzter Samstag im Monat (${dayOfMonth}/${lastDayOfMonth}).`);
        } else if (isTuesday) {
          messageToPost = tuesdayRunMessageContent;
          shouldPost = true;
          console.log(`Poste Tuesday Run für ${group.name} - ist Dienstag.`);
        } else {
          console.log(`Überspringe Sport-Nachricht für ${group.name} - weder letzter Samstag noch Dienstag.`);
        }
      }  else if (group.id.endsWith('_creative')) {
          // Creative Circle: Posten am letzten Freitag im Monat
          const isLastFridayOfMonth = (dayOfWeek === 5 && (dayOfMonth >= lastDayOfMonth - 6));
          if (isLastFridayOfMonth) {
              messageToPost = creativeCircleMessageContent;
              shouldPost = true;
              groupCategory = 'Creative';
              console.log(`Poste Creative Circle Nachricht für ${group.name} - ist letzter Freitag im Monat.`);
          } else {
              console.log(`Überspringe Creative Circle Nachricht für ${group.name} - ist nicht letzter Freitag im Monat.`);
          }

      }
       else {
        console.warn(`Gruppe ${group.id} passt zu keiner bekannten Kategorie (_ausgehen, _sport oder _creative), überspringe.`);
        continue; // Diese Gruppe überspringen
      }

      if (shouldPost && messageToPost) {
        try {
          const { error: insertError } = await supabase
            .from('chat_messages')
            .insert({
              group_id: group.id,
              sender: 'TRIBE Bot',
              avatar: 'https://cdn.jsdelivr.net/gh/MaikZ91/productiontools/bot_avatar.png',
              text: messageToPost,
              read_by: []
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
      } else {
        console.log(`Posten für Gruppe ${group.name} übersprungen, da keine Nachricht oder Bedingung nicht erfüllt.`);
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