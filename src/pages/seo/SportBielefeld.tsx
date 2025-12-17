import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Clock, ChevronRight, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
}

const SportBielefeld = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('community_events')
        .select('id, title, date, time, location, category')
        .eq('city', 'Bielefeld')
        .in('category', ['Sport', 'Fitness', 'Laufen', 'Fußball', 'Basketball'])
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(20);
      
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Welche Sportmöglichkeiten gibt es in Bielefeld?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Bielefeld bietet vielfältige Sportmöglichkeiten: Hochschulsport der Uni Bielefeld, zahlreiche Fitnessstudios, Laufgruppen im Teutoburger Wald, Sportvereine für alle Sportarten und regelmäßige Community-Sportevents über THE TRIBE."
        }
      },
      {
        "@type": "Question",
        "name": "Gibt es Fußball-Events in Bielefeld?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja! Arminia Bielefeld spielt in der SchücoArena, es gibt regelmäßige Public Viewings und Community-Kickerturniere. Über THE TRIBE findest du Mitspieler für spontane Fußballrunden."
        }
      },
      {
        "@type": "Question",
        "name": "Wo kann ich in Bielefeld joggen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Die beliebtesten Laufstrecken sind der Obersee, der Teutoburger Wald, der Botanische Garten und der Nordpark. THE TRIBE organisiert regelmäßig gemeinsame Laufgruppen."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Sport Events in Bielefeld | Fitness, Laufen, Fußball & mehr"
        description="Alle Sport-Events in Bielefeld: Hochschulsport, Fitness-Kurse, Laufgruppen, Fußball und mehr. Finde Sportpartner und Community-Events."
        keywords="Sport Bielefeld, Fitness Bielefeld, Hochschulsport Bielefeld, Laufen Bielefeld, Arminia Bielefeld, Sportvereine Bielefeld"
        url="https://liebefeld.lovable.app/sport-bielefeld"
      />
      
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">THE TRIBE</Link>
            <ChevronRight className="inline w-4 h-4 mx-2" />
            <span className="text-foreground">Sport</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <Dumbbell className="w-8 h-8 text-primary" />
            Sport Events in Bielefeld
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Fitness, Laufgruppen, Hochschulsport und Community-Sport
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Sportlich aktiv in Bielefeld</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Bielefeld ist eine Stadt für Sportbegeisterte. Der <strong>Hochschulsport der Universität Bielefeld</strong> 
            bietet über 100 verschiedene Sportarten – von A wie Aikido bis Z wie Zumba. Auch Nicht-Studierende 
            können an vielen Kursen teilnehmen. Die Kurse sind günstig und eine tolle Möglichkeit, neue Leute 
            kennenzulernen.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Der <strong>Teutoburger Wald</strong> direkt vor den Toren der Stadt ist perfekt für Outdoor-Sport: 
            Joggen, Mountainbiken, Wandern oder Trail-Running. Am <strong>Obersee</strong> treffen sich 
            Jogger und Spaziergänger auf der beliebten 4,5 km Runde. Die <strong>Sparrenburg</strong> ist 
            ein weiteres beliebtes Ziel für sportliche Ausflüge.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Mit THE TRIBE findest du Sportpartner für gemeinsame Aktivitäten. Ob spontane Fußballrunde, 
            regelmäßige Laufgruppe oder Fitness-Buddy – unsere Community verbindet Menschen, die zusammen 
            aktiv sein wollen.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Aktuelle Sport-Events in Bielefeld
          </h2>
          
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <article key={event.id} className="bg-card rounded-lg p-4 border border-border hover:border-primary/50 transition-colors">
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(event.date), 'EEEE, d. MMMM', { locale: de })}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {event.time} Uhr
                    </p>
                    {event.location && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Aktuell keine Sport-Events geplant. Schau später wieder vorbei!</p>
          )}
          
          <div className="mt-8 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Alle Events in THE TRIBE entdecken
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Häufige Fragen zu Sport in Bielefeld
          </h2>
          <div className="space-y-4">
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Welche Sportmöglichkeiten gibt es in Bielefeld?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Bielefeld bietet vielfältige Sportmöglichkeiten: Hochschulsport der Uni Bielefeld, zahlreiche 
                Fitnessstudios, Laufgruppen im Teutoburger Wald, Sportvereine für alle Sportarten und 
                regelmäßige Community-Sportevents über THE TRIBE.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Gibt es Fußball-Events in Bielefeld?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Ja! Arminia Bielefeld spielt in der SchücoArena, es gibt regelmäßige Public Viewings und 
                Community-Kickerturniere. Über THE TRIBE findest du Mitspieler für spontane Fußballrunden.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Wo kann ich in Bielefeld joggen?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Die beliebtesten Laufstrecken sind der Obersee, der Teutoburger Wald, der Botanische Garten 
                und der Nordpark. THE TRIBE organisiert regelmäßig gemeinsame Laufgruppen.
              </p>
            </details>
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Weitere Events in Bielefeld</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/party-bielefeld" className="text-primary hover:underline">Party & Nachtleben</Link>
            <Link to="/konzerte-bielefeld" className="text-primary hover:underline">Konzerte</Link>
            <Link to="/kunst-bielefeld" className="text-primary hover:underline">Kunst & Kultur</Link>
            <Link to="/events-heute" className="text-primary hover:underline">Events heute</Link>
            <Link to="/events-wochenende" className="text-primary hover:underline">Wochenend-Events</Link>
            <Link to="/" className="text-primary hover:underline">Alle Events</Link>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border mt-12 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} THE TRIBE Bielefeld - Deine Community für Events & Erlebnisse</p>
          <div className="mt-4 space-x-4">
            <Link to="/impressum" className="hover:text-primary">Impressum</Link>
            <Link to="/privacy" className="hover:text-primary">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SportBielefeld;
