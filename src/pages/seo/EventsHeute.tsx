import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Clock, ChevronRight, Sparkles } from 'lucide-react';
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

const EventsHeute = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from('community_events')
        .select('id, title, date, time, location, category')
        .eq('city', 'Bielefeld')
        .eq('date', todayStr)
        .order('time', { ascending: true });
      
      setEvents(data || []);
      setLoading(false);
    };
    fetchEvents();
  }, [todayStr]);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Was kann man heute in Bielefeld machen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Heute in Bielefeld: Aktuelle Events findest du auf THE TRIBE – von Partys und Konzerten über Sport bis zu Kulturveranstaltungen. Die App zeigt dir alle Veranstaltungen für heute mit Uhrzeit und Location."
        }
      },
      {
        "@type": "Question",
        "name": "Welche Veranstaltungen finden heute Abend in Bielefeld statt?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Abendliche Events in Bielefeld umfassen Club-Nights, Live-Musik, Theateraufführungen und Community-Treffen. Check THE TRIBE für eine aktuelle Übersicht aller Events heute Abend."
        }
      },
      {
        "@type": "Question",
        "name": "Gibt es spontane Aktivitäten für heute in Bielefeld?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Ja! Mit THE TRIBE findest du kurzfristige Events und Community-Aktivitäten. Nutze MIA, unsere KI-Assistentin, für personalisierte Vorschläge basierend auf deinen Interessen."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`Events heute in Bielefeld | ${format(today, 'd. MMMM yyyy', { locale: de })}`}
        description={`Was geht heute in Bielefeld? Alle Events und Veranstaltungen am ${format(today, 'd. MMMM', { locale: de })} – Party, Konzerte, Sport, Kultur. Jetzt entdecken!`}
        keywords="Events heute Bielefeld, Was geht heute Bielefeld, Veranstaltungen heute Bielefeld, Ausgehen heute Bielefeld"
        url="https://liebefeld.lovable.app/events-heute"
      />
      
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">THE TRIBE</Link>
            <ChevronRight className="inline w-4 h-4 mx-2" />
            <span className="text-foreground">Events heute</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Events heute in Bielefeld
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {format(today, 'EEEE, d. MMMM yyyy', { locale: de })} – Was geht heute?
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Was geht heute in Bielefeld?</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Du suchst nach spontanen Plänen für heute? Bielefeld hat an jedem Tag etwas zu bieten. 
            Ob After-Work-Drinks in der Altstadt, ein spontanes Konzert, gemeinsamer Sport im Park 
            oder ein Kulturabend im Theater – mit THE TRIBE findest du immer das passende Event.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Unsere KI-Assistentin <strong>MIA</strong> kennt deine Vorlieben und schlägt dir 
            personalisierte Events vor. Frag sie einfach "Was geht heute?" und erhalte maßgeschneiderte 
            Empfehlungen basierend auf deinen Interessen und bisherigen Likes.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Entdecke auch Community-Events: Andere THE TRIBE Mitglieder organisieren regelmäßig 
            spontane Aktivitäten – von gemeinsamen Laufrunden bis zu Spieleabenden. Schließ dich 
            an und lerne neue Leute kennen!
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Alle Events am {format(today, 'd. MMMM', { locale: de })}
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">{event.category}</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{event.title}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
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
            <div className="bg-card rounded-lg p-8 text-center border border-border">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Heute sind noch keine Events eingetragen.</p>
              <p className="text-sm text-muted-foreground">
                Schau in die THE TRIBE App für Community-Aktivitäten oder plane selbst etwas!
              </p>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Events mit MIA entdecken
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Häufige Fragen zu Events heute
          </h2>
          <div className="space-y-4">
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Was kann man heute in Bielefeld machen?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Heute in Bielefeld: Aktuelle Events findest du auf THE TRIBE – von Partys und Konzerten 
                über Sport bis zu Kulturveranstaltungen. Die App zeigt dir alle Veranstaltungen für heute 
                mit Uhrzeit und Location.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Welche Veranstaltungen finden heute Abend in Bielefeld statt?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Abendliche Events in Bielefeld umfassen Club-Nights, Live-Musik, Theateraufführungen 
                und Community-Treffen. Check THE TRIBE für eine aktuelle Übersicht aller Events heute Abend.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Gibt es spontane Aktivitäten für heute in Bielefeld?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Ja! Mit THE TRIBE findest du kurzfristige Events und Community-Aktivitäten. Nutze MIA, 
                unsere KI-Assistentin, für personalisierte Vorschläge basierend auf deinen Interessen.
              </p>
            </details>
          </div>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Events nach Kategorie</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/party-bielefeld" className="text-primary hover:underline">Party & Nachtleben</Link>
            <Link to="/konzerte-bielefeld" className="text-primary hover:underline">Konzerte</Link>
            <Link to="/sport-bielefeld" className="text-primary hover:underline">Sport Events</Link>
            <Link to="/kunst-bielefeld" className="text-primary hover:underline">Kunst & Kultur</Link>
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

export default EventsHeute;
