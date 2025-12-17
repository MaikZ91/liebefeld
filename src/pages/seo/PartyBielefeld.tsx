import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react';
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

const PartyBielefeld = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('community_events')
        .select('id, title, date, time, location, category')
        .eq('city', 'Bielefeld')
        .in('category', ['Party', 'Nightlife', 'Club', 'DJ'])
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
        "name": "Wo kann man in Bielefeld am besten feiern?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Die beliebtesten Clubs in Bielefeld sind das Forum, die Stereo Bar, das Movie und der Ringlokschuppen. In der Altstadt findest du viele Bars und Kneipen für einen entspannten Abend."
        }
      },
      {
        "@type": "Question",
        "name": "Wann ist die beste Zeit zum Ausgehen in Bielefeld?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Die meisten Clubs öffnen ab 23 Uhr, die Hauptzeit ist zwischen Mitternacht und 3 Uhr. Freitag und Samstag sind die beliebtesten Ausgehnächte."
        }
      },
      {
        "@type": "Question",
        "name": "Gibt es Studentenpartys in Bielefeld?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja! Die Universität Bielefeld und das AStA organisieren regelmäßig Studentenpartys. Auch viele Clubs bieten spezielle Studenten-Angebote an Werktagen."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Party & Nachtleben in Bielefeld | Events, Clubs & Partys"
        description="Entdecke die besten Partys, Clubs und Nachtleben-Events in Bielefeld. Aktuelle Veranstaltungen, Club-Nights und Ausgeh-Tipps für heute und das Wochenende."
        keywords="Party Bielefeld, Nachtleben Bielefeld, Clubs Bielefeld, Ausgehen Bielefeld, Studentenpartys Bielefeld, Disco Bielefeld"
        url="https://liebefeld.lovable.app/party-bielefeld"
      />
      
      {/* Structured Data for FAQ */}
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">THE TRIBE</Link>
            <ChevronRight className="inline w-4 h-4 mx-2" />
            <span className="text-foreground">Party & Nachtleben</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Party & Nachtleben in Bielefeld
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Die besten Partys, Clubs und Events für unvergessliche Nächte
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* SEO Content Section */}
        <section className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Bielefelds Nachtleben entdecken</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Bielefeld bietet ein vielfältiges Nachtleben für jeden Geschmack. Von angesagten Clubs wie dem 
            <strong> Forum</strong> und der <strong>Stereo Bar</strong> bis hin zu gemütlichen Bars in der 
            Altstadt – hier findest du garantiert den perfekten Ort für deinen Abend. Die Club-Szene ist 
            besonders für elektronische Musik bekannt, während die Kneipenmeile rund um den Alten Markt 
            mit Live-Musik und entspannter Atmosphäre lockt.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Als Universitätsstadt hat Bielefeld eine lebendige Studentenszene. Regelmäßige Studentenpartys, 
            günstige Getränkepreise unter der Woche und spezielle Events machen die Stadt zu einem 
            attraktiven Ziel für junge Nachtschwärmer. Der <strong>Ringlokschuppen</strong> ist dabei 
            einer der bekanntesten Veranstaltungsorte für größere Events und Konzerte.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Mit THE TRIBE verpasst du keine Party mehr. Wir zeigen dir alle aktuellen Events, 
            Club-Nights und Veranstaltungen in Bielefeld – filtere nach Datum, Location oder Musikrichtung 
            und finde die perfekte Party für dich und deine Crew.
          </p>
        </section>

        {/* Events Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Aktuelle Party-Events in Bielefeld
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
            <p className="text-muted-foreground">Aktuell keine Party-Events geplant. Schau später wieder vorbei!</p>
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

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Häufige Fragen zum Nachtleben in Bielefeld
          </h2>
          <div className="space-y-4">
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Wo kann man in Bielefeld am besten feiern?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Die beliebtesten Clubs in Bielefeld sind das Forum, die Stereo Bar, das Movie und der 
                Ringlokschuppen. In der Altstadt findest du viele Bars und Kneipen für einen entspannten Abend.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Wann ist die beste Zeit zum Ausgehen in Bielefeld?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Die meisten Clubs öffnen ab 23 Uhr, die Hauptzeit ist zwischen Mitternacht und 3 Uhr. 
                Freitag und Samstag sind die beliebtesten Ausgehnächte.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Gibt es Studentenpartys in Bielefeld?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Ja! Die Universität Bielefeld und das AStA organisieren regelmäßig Studentenpartys. 
                Auch viele Clubs bieten spezielle Studenten-Angebote an Werktagen.
              </p>
            </details>
          </div>
        </section>

        {/* Internal Links */}
        <section className="border-t border-border pt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Weitere Events in Bielefeld</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/konzerte-bielefeld" className="text-primary hover:underline">Konzerte</Link>
            <Link to="/sport-bielefeld" className="text-primary hover:underline">Sport Events</Link>
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

export default PartyBielefeld;
