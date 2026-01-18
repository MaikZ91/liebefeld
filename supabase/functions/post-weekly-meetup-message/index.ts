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
    console.log('Starte das Posten der wöchentlichen Community-Nachrichten (Alle gleichzeitig)...');

    // Wochentag und Monatstag werden nicht mehr für die bedingte Posting-Logik verwendet,
    // bleiben aber als Referenz oder für zukünftige erweiterte Logik erhalten.
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const dayOfMonth = today.getDate();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(); 

    // 1. Nachrichten-Inhalte definieren
    const kennenlernabendMessageContent = `🍻 TRIBE Stammtisch – Jeden Mittwoch!

Hey Leute! Diese Woche ist wieder Stammtisch-Zeit! 🎉

Ob du neu in der Stadt bist, einfach mal raus willst oder schon Teil der Tribe bist – komm vorbei und lerne neue Leute kennen!

📅 **Wann:** Jeden Mittwoch ab 19:30 Uhr
📍 **Wo:** Wird kurzfristig bekannt gegeben

Wer ist dabei? 👍 unter diese Nachricht, um dich anzumelden!`;

    // Bild-URL für Kennenlernabend
    const kennenlernabendImageUrl = 'https://liebefeld.lovable.app/images/tribe/tribe-stammtisch.jpg';

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

Teilt eure Ideen, findet Mitstreiter und gestaltet unvergessliche Momente. Wer ist dabei und hat Lust, den nächsten Creative Circle mitzugestalten? 👍 unter diese Nachricht, um euch abzustimmen!`;


    // 2. Alle relevanten Gruppen abrufen (Ausgehen, Sport und Kreativität)
    const { data: relevantGroups, error: groupsError } = await supabase
      .from('chat_groups')
      .select('id, name')
      .or('id.like.%_ausgehen,id.like.%_sport,id.like.%_kreativität');

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

    // 3. Nachricht an jede Gruppe posten, basierend auf der Kategorie und Wochentag
    // Mittwoch = 3 (0=Sonntag, 1=Montag, ..., 3=Mittwoch)
    const isWednesday = dayOfWeek === 3;
    
    for (const group of relevantGroups) {
      let messageToPost = '';
      let groupCategory = '';
      let shouldPost = false;
      let imageUrl: string | null = null;

      if (group.id.endsWith('_ausgehen')) {
        // Kennenlernabend nur am Mittwoch posten
        if (isWednesday) {
          messageToPost = kennenlernabendMessageContent;
          imageUrl = kennenlernabendImageUrl;
          groupCategory = 'Ausgehen';
          shouldPost = true;
        }
      } else if (group.id.endsWith('_sport')) {
        // Sport-Nachrichten immer posten
        messageToPost = wandersamstagMessageContent + "\n\n---\n\n" + tuesdayRunMessageContent;
        groupCategory = 'Sport';
        shouldPost = true;
      } else if (group.id.endsWith('_kreativität')) {
        // Kreativität-Nachrichten immer posten
        messageToPost = creativeCircleMessageContent;
        groupCategory = 'Kreativität';
        shouldPost = true;
      } else {
        console.warn(`Gruppe ${group.id} passt zu keiner bekannten Kategorie, überspringe.`);
        continue;
      }

      if (shouldPost && messageToPost) {
        try {
          const insertData: any = {
            group_id: group.id,
            sender: 'MIA',
            avatar: 'https://ykleosfvtqcmqxqihnod.supabase.co/storage/v1/object/public/avatars/mia-avatar.png',
            text: messageToPost,
            read_by: []
          };
          
          // Bild hinzufügen wenn vorhanden
          if (imageUrl) {
            insertData.media_url = imageUrl;
          }
          
          const { error: insertError } = await supabase
            .from('chat_messages')
            .insert(insertData);

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
        console.log(`Posten für Gruppe ${group.name} übersprungen (Wochentag: ${dayOfWeek}, isWednesday: ${isWednesday}).`);
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