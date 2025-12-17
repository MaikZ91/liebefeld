import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Clock, ChevronRight, Palette } from 'lucide-react';
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

const KunstBielefeld = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('community_events')
        .select('id, title, date, time, location, category')
        .eq('city', 'Bielefeld')
        .in('category', ['Art', 'Kunst', 'Kultur', 'Theater', 'Museum', 'Ausstellung', 'Kreativität'])
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
        "name": "Welche Museen gibt es in Bielefeld?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Die wichtigsten Museen in Bielefeld sind die Kunsthalle Bielefeld mit moderner Kunst, das Historische Museum für Stadtgeschichte, das Naturkunde-Museum und das Museum Huelsmann für Kunstgewerbe."
        }
      },
      {
        "@type": "Question",
        "name": "Wo kann ich in Bielefeld Theater sehen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Das Theater Bielefeld bietet Oper, Schauspiel und Ballett. Daneben gibt es das TAM (Theater am Alten Markt), die Theaterwerkstatt und verschiedene freie Theatergruppen in der Stadt."
        }
      },
      {
        "@type": "Question",
        "name": "Gibt es Kreativ-Workshops in Bielefeld?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja! Die VHS Bielefeld, verschiedene Ateliers und THE TRIBE organisieren regelmäßig Kreativ-Workshops wie Malkurse, Töpfern, Fotografie und mehr."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Kunst & Kultur in Bielefeld | Museen, Theater, Ausstellungen"
        description="Entdecke Kunst und Kultur in Bielefeld: Museen, Theater, Ausstellungen, Kreativ-Workshops und kulturelle Events. Dein Guide für Kunst in Bielefeld."
        keywords="Kunst Bielefeld, Kultur Bielefeld, Museen Bielefeld, Theater Bielefeld, Ausstellungen Bielefeld, Kunsthalle Bielefeld"
        url="https://liebefeld.lovable.app/kunst-bielefeld"
      />
      
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">THE TRIBE</Link>
            <ChevronRight className="inline w-4 h-4 mx-2" />
            <span className="text-foreground">Kunst & Kultur</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <Palette className="w-8 h-8 text-primary" />
            Kunst & Kultur in Bielefeld
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Museen, Theater, Ausstellungen und kreative Events
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Kulturelles Bielefeld entdecken</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Bielefeld überrascht mit einer reichen Kulturszene. Die <strong>Kunsthalle Bielefeld</strong>, 
            entworfen von Philip Johnson, beherbergt eine beeindruckende Sammlung moderner und zeitgenössischer 
            Kunst. Das <strong>Historische Museum</strong> erzählt die Geschichte der Stadt und Region, 
            während das <strong>Museum Huelsmann</strong> europäisches Kunstgewerbe präsentiert.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Das <strong>Theater Bielefeld</strong> ist eines der größten Drei-Sparten-Theater in 
            Nordrhein-Westfalen mit Oper, Schauspiel und Ballett. Die freie Szene ergänzt das Angebot 
            mit experimentellem Theater, Improvisationen und Off-Produktionen. Regelmäßige 
            <strong> Ausstellungen</strong> in Galerien und alternativen Kunsträumen zeigen lokale 
            und internationale Künstler.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            THE TRIBE verbindet Kunstbegeisterte in Bielefeld. Entdecke Vernissagen, Theateraufführungen, 
            Kreativ-Workshops und kulturelle Events – und finde Gleichgesinnte für gemeinsame Kulturerlebnisse.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Aktuelle Kunst & Kultur Events
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
            <p className="text-muted-foreground">Aktuell keine Kultur-Events geplant. Schau später wieder vorbei!</p>
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
            Häufige Fragen zu Kunst & Kultur
          </h2>
          <div className="space-y-4">
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Welche Museen gibt es in Bielefeld?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Die wichtigsten Museen in Bielefeld sind die Kunsthalle Bielefeld mit moderner Kunst, 
                das Historische Museum für Stadtgeschichte, das Naturkunde-Museum und das Museum 
                Huelsmann für Kunstgewerbe.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Wo kann ich in Bielefeld Theater sehen?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Das Theater Bielefeld bietet Oper, Schauspiel und Ballett. Daneben gibt es das TAM 
                (Theater am Alten Markt), die Theaterwerkstatt und verschiedene freie Theatergruppen in der Stadt.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Gibt es Kreativ-Workshops in Bielefeld?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Ja! Die VHS Bielefeld, verschiedene Ateliers und THE TRIBE organisieren regelmäßig 
                Kreativ-Workshops wie Malkurse, Töpfern, Fotografie und mehr.
              </p>
            </details>
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Weitere Events in Bielefeld</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/party-bielefeld" className="text-primary hover:underline">Party & Nachtleben</Link>
            <Link to="/konzerte-bielefeld" className="text-primary hover:underline">Konzerte</Link>
            <Link to="/sport-bielefeld" className="text-primary hover:underline">Sport Events</Link>
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

export default KunstBielefeld;
