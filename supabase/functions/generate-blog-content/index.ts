import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

interface BlogRequest {
  type: 'weekly-preview' | 'event-recap' | 'category-guide' | 'daily-highlights';
  city?: string;
  forceGenerate?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { type = 'daily-highlights', city = 'Bielefeld', forceGenerate = false }: BlogRequest = await req.json();

    console.log(`Generating ${type} blog content for ${city}`);

    // Fetch upcoming events for context
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data: events, error: eventsError } = await supabase
      .from('community_events')
      .select('*')
      .gte('date', today)
      .lte('date', nextWeek)
      .order('date', { ascending: true })
      .order('likes', { ascending: false })
      .limit(20);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      throw new Error('Failed to fetch events');
    }

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No events found for blog generation' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch recent chat activity for community insights
    const { data: recentChats } = await supabase
      .from('chat_messages')
      .select('text, sender, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    // Generate content based on type
    const prompt = generatePrompt(type, events, recentChats || [], city);
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: `Du bist ein lokaler Event-Blogger für ${city}. Schreibe packende, informative Blog-Artikel auf Deutsch. 
            Nutze einen freundlichen, einladenden Ton. Formatiere mit Markdown (## für Überschriften, **bold** für wichtige Events).
            Füge immer praktische Infos wie Datum, Uhrzeit und Ort ein.`
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content generated');
    }

    // Generate slug and metadata
    const slug = generateSlug(type, city);
    const title = generateTitle(type, city);
    const excerpt = content.substring(0, 200).replace(/[#*]/g, '').trim() + '...';
    const tags = extractTags(events, type);

    // Check if article with same slug already exists today
    const existingArticle = await supabase
      .from('blog_articles')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingArticle.data && !forceGenerate) {
      // Update existing article
      const { error: updateError } = await supabase
        .from('blog_articles')
        .update({
          content,
          excerpt,
          tags,
          event_ids: events.slice(0, 5).map(e => e.id),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingArticle.data.id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ 
        success: true, 
        action: 'updated',
        slug,
        articleId: existingArticle.data.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert new article
    const { data: newArticle, error: insertError } = await supabase
      .from('blog_articles')
      .insert({
        slug,
        title,
        excerpt,
        content,
        category: type,
        tags,
        city,
        event_ids: events.slice(0, 5).map(e => e.id),
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log(`Blog article created: ${slug}`);

    return new Response(JSON.stringify({ 
      success: true, 
      action: 'created',
      slug,
      articleId: newArticle.id,
      title
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating blog content:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generatePrompt(type: string, events: any[], chats: any[], city: string): string {
  const eventsList = events.map(e => 
    `- ${e.title} (${e.category}) am ${e.date} um ${e.time} in ${e.location || 'tba'} - ${e.likes || 0} Likes`
  ).join('\n');

  const chatInsights = chats.length > 0 
    ? `\n\nAktuelle Community-Gespräche:\n${chats.slice(0, 10).map(c => `"${c.text.substring(0, 100)}"`).join('\n')}`
    : '';

  switch (type) {
    case 'weekly-preview':
      return `Schreibe eine spannende Wochenvorschau für ${city}.

Events diese Woche:
${eventsList}
${chatInsights}

Strukturiere den Artikel so:
1. Einleitung mit Wetter/Stimmung
2. Top-Highlights der Woche (3-4 Events)
3. Geheimtipps (1-2 kleinere Events)
4. Praktische Tipps für das Wochenende
5. Call-to-Action zur Tribe App

Schreibe mindestens 500 Wörter.`;

    case 'event-recap':
      return `Schreibe einen Rückblick auf die vergangene Woche in ${city}.

Events der Woche:
${eventsList}
${chatInsights}

Beschreibe:
1. Was war los in der Stadt?
2. Welche Events waren besonders beliebt?
3. Community-Highlights
4. Ausblick auf nächste Woche

Schreibe mindestens 400 Wörter.`;

    case 'category-guide':
      const categories = [...new Set(events.map(e => e.category))];
      return `Erstelle einen Guide für ${categories[0] || 'Events'} in ${city}.

Relevante Events:
${eventsList}

Schreibe:
1. Was macht ${city} für diese Kategorie besonders?
2. Die besten Locations
3. Kommende Events
4. Insider-Tipps

Schreibe mindestens 400 Wörter.`;

    case 'daily-highlights':
    default:
      return `Schreibe einen kurzen, knackigen Tagesüberblick für ${city}.

Heutige Events:
${eventsList}
${chatInsights}

Fokussiere auf:
1. Was geht heute ab?
2. Top 3 Events des Tages
3. Schneller Überblick (max 300 Wörter)`;
  }
}

function generateSlug(type: string, city: string): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  
  switch (type) {
    case 'weekly-preview':
      const weekNum = getWeekNumber(date);
      return `wochenvorschau-${citySlug}-kw${weekNum}-${date.getFullYear()}`;
    case 'event-recap':
      const lastWeek = getWeekNumber(new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000));
      return `rueckblick-${citySlug}-kw${lastWeek}-${date.getFullYear()}`;
    case 'category-guide':
      return `guide-${citySlug}-${dateStr}`;
    case 'daily-highlights':
    default:
      return `events-${citySlug}-${dateStr}`;
  }
}

function generateTitle(type: string, city: string): string {
  const date = new Date();
  const weekNum = getWeekNumber(date);
  const monthName = date.toLocaleDateString('de-DE', { month: 'long' });
  
  switch (type) {
    case 'weekly-preview':
      return `Wochenvorschau ${city} KW${weekNum}: Die besten Events`;
    case 'event-recap':
      return `Rückblick ${city}: Was letzte Woche los war`;
    case 'category-guide':
      return `Event-Guide ${city} ${monthName} ${date.getFullYear()}`;
    case 'daily-highlights':
    default:
      return `Events heute in ${city} - ${date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}`;
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function extractTags(events: any[], type: string): string[] {
  const categories = [...new Set(events.map(e => e.category))];
  const baseTags = ['events', 'bielefeld', 'ausgehen'];
  
  const categoryTags = categories.slice(0, 3);
  const typeTags = type === 'weekly-preview' ? ['wochenvorschau'] : 
                   type === 'event-recap' ? ['rückblick'] : 
                   type === 'category-guide' ? ['guide'] : ['heute'];
  
  return [...baseTags, ...categoryTags, ...typeTags];
}
