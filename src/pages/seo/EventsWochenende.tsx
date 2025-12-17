import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Clock, ChevronRight, PartyPopper } from 'lucide-react';
import { format, nextFriday, nextSaturday, nextSunday, isFriday, isSaturday, isSunday, startOfDay, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
}

const EventsWochenende = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const today = startOfDay(new Date());
  
  // Calculate weekend dates
  const getWeekendDates = () => {
    const isWeekend = isFriday(today) || isSaturday(today) || isSunday(today);
    if (isWeekend) {
      // If it's weekend, show current weekend
      if (isSunday(today)) {
        return { start: today, end: today };
      }
      const friday = isFriday(today) ? today : addDays(today, -1);
      const sunday = addDays(friday, 2);
      return { start: friday, end: sunday };
    }
    // Otherwise show next weekend
    return { start: nextFriday(today), end: nextSunday(today) };
  };
  
  const { start: weekendStart, end: weekendEnd } = getWeekendDates();

  useEffect(() => {
    const fetchEvents = async () => {
      const startStr = weekendStart.toISOString().split('T')[0];
      const endStr = weekendEnd.toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('community_events')
        .select('id, title, date, time, location, category')
        .eq('city', 'Bielefeld')
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
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
        "name": "Was kann man am Wochenende in Bielefeld machen?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Am Wochenende bietet Bielefeld zahlreiche Möglichkeiten: Clubnächte und Partys, Konzerte, Sportevents, Märkte, Kulturveranstaltungen im Theater und Museen, sowie Community-Aktivitäten über THE TRIBE."
        }
      },
      {
        "@type": "Question",
        "name": "Welche Partys finden am Wochenende in Bielefeld statt?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Die Bielefelder Clubs wie Forum, Stereo Bar und Movie haben am Wochenende verschiedene Themennächte. Aktuelle Party-Events findest du immer aktuell auf THE TRIBE."
        }
      },
      {
        "@type": "Question",
        "name": "Gibt es Wochenend-Ausflugstipps für Bielefeld?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Beliebte Wochenend-Aktivitäten sind Wanderungen im Teutoburger Wald, Besuch der Sparrenburg, Radtouren zum Obersee oder kulturelle Ausflüge zur Kunsthalle. THE TRIBE zeigt auch Community-organisierte Ausflüge."
        }
      }
    ]
  };

  const groupedEvents = events.reduce((acc, event) => {
    const dateKey = event.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`Wochenend-Events Bielefeld | ${format(weekendStart, 'd.', { locale: de })} - ${format(weekendEnd, 'd. MMMM', { locale: de })}`}
        description={`Alle Wochenend-Events in Bielefeld vom ${format(weekendStart, 'd.', { locale: de })} bis ${format(weekendEnd, 'd. MMMM', { locale: de })}. Partys, Konzerte, Sport und Kultur – plane dein perfektes Wochenende!`}
        keywords="Wochenende Bielefeld, Events Wochenende Bielefeld, Samstag Bielefeld, Sonntag Bielefeld, Ausgehen Wochenende Bielefeld"
        url="https://liebefeld.lovable.app/events-wochenende"
      />
      
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">THE TRIBE</Link>
            <ChevronRight className="inline w-4 h-4 mx-2" />
            <span className="text-foreground">Wochenend-Events</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <PartyPopper className="w-8 h-8 text-primary" />
            Wochenend-Events in Bielefeld
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {format(weekendStart, 'EEEE, d.', { locale: de })} - {format(weekendEnd, 'EEEE, d. MMMM', { locale: de })}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="prose prose-invert max-w-none mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Dein Wochenende in Bielefeld planen</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Das Wochenende ist die beste Zeit, Bielefeld zu erleben. Freitagabend startet das Nachtleben 
            in den Clubs der Stadt, Samstag locken Konzerte, Märkte und Kulturevents, und Sonntag bietet 
            sich perfekt für entspannte Ausflüge in den <strong>Teutoburger Wald</strong> oder einen 
            Museumsbesuch in der <strong>Kunsthalle</strong>.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Die THE TRIBE Community ist am Wochenende besonders aktiv. Schließ dich spontanen 
            Aktivitäten an – von gemeinsamen Wanderungen über Brunch-Treffen bis zu Spieleabenden. 
            Frag MIA nach Empfehlungen, die zu deinen Interessen passen!
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Plane im Voraus oder entscheide spontan – THE TRIBE zeigt dir immer die aktuellsten 
            Events für dein perfektes Wochenende in Bielefeld.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Events dieses Wochenende
          </h2>
          
          {loading ? (
            <div className="space-y-8">
              {[...Array(2)].map((_, i) => (
                <div key={i}>
                  <div className="h-6 bg-muted rounded w-48 mb-4" />
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="bg-card rounded-lg p-4 animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedEvents).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedEvents).map(([dateStr, dayEvents]) => (
                <div key={dateStr}>
                  <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {format(new Date(dateStr), 'EEEE, d. MMMM', { locale: de })}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({dayEvents.length} Events)
                    </span>
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dayEvents.map((event) => (
                      <article key={event.id} className="bg-card rounded-lg p-4 border border-border hover:border-primary/50 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">{event.category}</span>
                        </div>
                        <h4 className="font-semibold text-foreground mb-2 line-clamp-2">{event.title}</h4>
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
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg p-8 text-center border border-border">
              <PartyPopper className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Noch keine Wochenend-Events eingetragen.</p>
              <p className="text-sm text-muted-foreground">
                Schau in die THE TRIBE App für Community-Aktivitäten!
              </p>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Wochenende mit MIA planen
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Häufige Fragen zum Wochenende
          </h2>
          <div className="space-y-4">
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Was kann man am Wochenende in Bielefeld machen?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Am Wochenende bietet Bielefeld zahlreiche Möglichkeiten: Clubnächte und Partys, Konzerte, 
                Sportevents, Märkte, Kulturveranstaltungen im Theater und Museen, sowie Community-Aktivitäten 
                über THE TRIBE.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Welche Partys finden am Wochenende in Bielefeld statt?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Die Bielefelder Clubs wie Forum, Stereo Bar und Movie haben am Wochenende verschiedene 
                Themennächte. Aktuelle Party-Events findest du immer aktuell auf THE TRIBE.
              </p>
            </details>
            <details className="bg-card rounded-lg border border-border">
              <summary className="p-4 cursor-pointer font-medium text-foreground hover:text-primary">
                Gibt es Wochenend-Ausflugstipps für Bielefeld?
              </summary>
              <p className="px-4 pb-4 text-muted-foreground">
                Beliebte Wochenend-Aktivitäten sind Wanderungen im Teutoburger Wald, Besuch der Sparrenburg, 
                Radtouren zum Obersee oder kulturelle Ausflüge zur Kunsthalle. THE TRIBE zeigt auch 
                Community-organisierte Ausflüge.
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
            <Link to="/events-heute" className="text-primary hover:underline">Events heute</Link>
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

export default EventsWochenende;
