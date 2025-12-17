import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Clock, ChevronRight, Music } from 'lucide-react';
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

const KonzerteBielefeld = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('community_events')
        .select('id, title, date, time, location, category')
        .eq('city', 'Bielefeld')
        .in('category', ['Concert', 'Konzert', 'Live-Musik', 'Music'])
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
        "name": "Welche Konzert-Locations gibt es in Bielefeld?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Die wichtigsten Konzert-Locations in Bielefeld sind die Lokschuppen, die Seidensticker Halle für große Acts, das Forum für elektronische Musik, und kleinere Venues wie das Bunker Ulmenwall für Indie und Alternative."
        }
      },
      {
        "@type": "Question",
        "name": "Wo kann ich Konzerttickets für Bielefeld kaufen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Tickets für Konzerte in Bielefeld kannst du online über Eventim, Ticketmaster oder direkt bei den Veranstaltern kaufen. THE TRIBE zeigt dir alle Konzerte und verlinkt direkt zu den Ticketshops."
        }
      },
      {
        "@type": "Question",
        "name": "Gibt es Open-Air-Konzerte in Bielefeld?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja! Im Sommer finden regelmäßig Open-Air-Konzerte im Ravensberger Park, auf der Sparrenburg und bei verschiedenen Festivals in der Region statt."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Konzerte in Bielefeld | Live-Musik, Festivals & Veranstaltungen"
        description="Alle Konzerte und Live-Musik-Events in Bielefeld. Von Rock bis Klassik, von kleinen Clubs bis zur Seidensticker Halle – finde dein nächstes Konzert."
        keywords="Konzerte Bielefeld, Live-Musik Bielefeld, Festivals Bielefeld, Konzerttickets Bielefeld, Veranstaltungen Bielefeld"
        url="https://liebefeld.lovable.app/konzerte-bielefeld"
      />
      
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">THE TRIBE</Link>
            <ChevronRight className="inline w-4 h-4 mx-2" />
            <span className="text-foreground">Konzerte</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <Music className="w-8 h-8 text-primary" />
            Konzerte & Live-Musik in Bielefeld
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Aktuelle Konzerte, Festivals und Live-Auftritte in deiner Stadt
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Live-Musik in Bielefeld erleben</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Bielefeld hat eine lebendige Musikszene, die weit über die Stadtgrenzen hinaus bekannt ist. 
            Die <strong>Seidensticker Halle</strong> zieht regelmäßig internationale Stars an, während 
            der <strong>Ringlokschuppen</strong> als kulturelles Zentrum für alternative Musik und 
            besondere Events gilt. Für Indie- und Underground-Konzerte ist der <strong>Bunker Ulmenwall</strong> 
            die erste Adresse.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Von klassischen Konzerten in der <strong>Rudolf-Oetker-Halle</strong> bis zu intimen 
            Acoustic-Sessions in kleinen Bars – die Vielfalt der Bielefelder Musikszene begeistert 
            Fans aller Genres. Die Stadt ist auch Heimat mehrerer Festivals, darunter das 
            <strong> Bielefelder Sparrenburg-Festival</strong> im Sommer.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            THE TRIBE sammelt alle Konzerte und Live-Events für dich an einem Ort. Entdecke neue 
            Künstler, plane deinen Konzertabend und verpasse nie wieder ein Highlight in Bielefeld.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Aktuelle Konzerte in Bielefeld
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
            <p className="text-muted-foreground">Aktuell keine Konzerte geplant. Schau später wieder vorbei!</p>
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
            Häufige Fragen zu Konzerten in Bielefeld
          </h2>
          <div className="space-y-4">
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Welche Konzert-Locations gibt es in Bielefeld?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Die wichtigsten Konzert-Locations in Bielefeld sind die Lokschuppen, die Seidensticker Halle 
                für große Acts, das Forum für elektronische Musik, und kleinere Venues wie das Bunker Ulmenwall 
                für Indie und Alternative.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Wo kann ich Konzerttickets für Bielefeld kaufen?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Tickets für Konzerte in Bielefeld kannst du online über Eventim, Ticketmaster oder direkt 
                bei den Veranstaltern kaufen. THE TRIBE zeigt dir alle Konzerte und verlinkt direkt zu den Ticketshops.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Gibt es Open-Air-Konzerte in Bielefeld?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Ja! Im Sommer finden regelmäßig Open-Air-Konzerte im Ravensberger Park, auf der Sparrenburg 
                und bei verschiedenen Festivals in der Region statt.
              </p>
            </details>
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Weitere Events in Bielefeld</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/party-bielefeld" className="text-primary hover:underline">Party & Nachtleben</Link>
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

export default KonzerteBielefeld;
