
import React, { useEffect } from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BadgeCheck, Calendar, Clock, Heart, Link as LinkIcon, Lock, Mail, MapPin, MessageSquare, Users, FileText } from 'lucide-react';
import ImageCarousel from '@/components/ImageCarousel';
import { Link } from 'react-router-dom';

const About = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const communityImages = [
    {
      src: "/lovable-uploads/c38064ee-a32f-4ecc-b148-f9c53c28d472.png",
      alt: "Music session with the community"
    },
    {
      src: "/lovable-uploads/8562fff2-2b62-4552-902b-cc62457a3402.png",
      alt: "Electric Circle Vol.3 DJ session"
    },
    {
      src: "/lovable-uploads/2653c557-0afe-4690-9d23-0b523cb09e3e.png",
      alt: "Tribe Stammtisch community gathering"
    },
    {
      src: "/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png",
      alt: "Music band session"
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col">
      <CalendarNavbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
          <section className="mb-16">
            <div className="text-center mb-10">
              <span className="inline-block py-1 px-3 rounded-full bg-secondary text-sm font-medium mb-4">Über Uns</span>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">THE TRIBE.BI</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Wir verbinden Menschen im echten Leben und machen Bielefeld lebendiger!
              </p>
            </div>
          </section>
          
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Unsere Mission</h2>
                    <p className="text-muted-foreground">
                      Wir möchten Bielefeld lebendiger gestalten, indem wir Menschen im echten Leben zusammenbringen. 
                      In einer Zeit, in der digitale Verbindungen oft unseren Alltag dominieren, schaffen wir 
                      Möglichkeiten für authentische Begegnungen, gemeinsame Erlebnisse und den Aufbau einer 
                      starken lokalen Gemeinschaft.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Unsere Vision</h2>
                    <p className="text-muted-foreground">
                      Wir streben nach einer Stadt, in der Gemeinschaft wieder im Mittelpunkt steht. 
                      Eine Stadt, in der Menschen verschiedener Hintergründe und Interessen zusammenkommen, 
                      Ideen teilen und gemeinsam Bielefeld zu einem pulsierenden Ort machen. 
                      Unser Kalender ist mehr als eine Plattform – er ist eine Einladung, Teil dieser 
                      lebenswerten Gemeinschaft zu werden.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="order-1 md:order-2">
                <ImageCarousel images={communityImages} autoSlideInterval={6000} />
              </div>
            </div>
          </section>
          
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Warum einen Community Kalender?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="glass-card hover-scale">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Unsere Partner</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center bg-white/50 rounded-xl p-8 shadow-sm border border-white/30">
              <div>
                <h3 className="text-xl font-bold mb-4">Social Tides</h3>
                <p className="text-muted-foreground mb-4">
                  Wir werden durch Social Tides gefördert, um Bielefeld zu verbinden und lokale 
                  Gemeinschaften zu stärken. Mit ihrer Unterstützung schaffen wir neue Wege, 
                  um Menschen zusammenzubringen.
                </p>
                <Button variant="outline" className="rounded-full gap-2" asChild>
                  <a href="https://www.socialtides.eu/community/the-tribe.bi" target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="h-4 w-4" />
                    Mehr erfahren
                  </a>
                </Button>
              </div>
              
              <div className="flex justify-center">
                <div className="glass-card p-6 rounded-xl hover-scale">
                  <img 
                    src="/lovable-uploads/764c9b33-5d7d-4134-b503-c77e23c469f9.png" 
                    alt="Social Tides Logo" 
                    className="max-h-40 object-contain"
                  />
                </div>
              </div>
            </div>
          </section>
          
          <section className="mb-16">
            <div className="glass-card p-8 md:p-12 rounded-2xl">
              <div className="text-center mb-10">
                <span className="inline-block py-1 px-3 rounded-full bg-secondary text-sm font-medium mb-4">Werde Partner</span>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">Deine Marke in der Bielefelder Community</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Erreiche die aktive Bielefelder Community und profitiere von unserer lokalen Reichweite.
                  Gemeinsam können wir maßgeschneiderte Kooperationen entwickeln.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {partnershipOptions.map((option, index) => (
                  <Card key={index} className="hover-scale">
                    <CardContent className="p-6">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <option.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">{option.title}</h3>
                      <p className="text-muted-foreground">{option.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="bg-card rounded-xl p-6 md:p-8 shadow-sm border border-border text-center">
                <h3 className="text-xl font-bold mb-6">Kontaktiere uns für eine Partnerschaft</h3>
                
                <Button 
                  variant="default" 
                  className="rounded-full px-8 py-6" 
                  size="lg"
                  asChild
                >
                  <a href="mailto:maik.z@gmx.de">
                    <Mail className="mr-2 h-4 w-4" /> Direkt per E-Mail kontaktieren
                  </a>
                </Button>
              </div>
            </div>
          </section>
          
          <section className="mb-16">
            <div className="glass-card rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Mach mit!</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                Sei Teil unserer Bewegung für ein lebendigeres Bielefeld! Entdecke spannende Events, 
                triff neue Menschen und bringe deine eigenen Ideen ein.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="rounded-full shadow-md hover:shadow-lg transition-all">
                  <Users className="mr-2 h-4 w-4" /> Community beitreten
                </Button>
                <Button variant="outline" className="rounded-full">
                  <Calendar className="mr-2 h-4 w-4" /> Event erstellen
                </Button>
              </div>
            </div>
          </section>
          
          <section id="impressum" className="mb-16">
            <div className="max-w-3xl mx-auto border rounded-lg p-6 bg-card">
              <h2 className="text-2xl font-bold mb-4">Impressum</h2>
              <div className="h-1 w-20 bg-primary/70 rounded mb-6"></div>
              <p className="text-muted-foreground mb-4">Gemäß § 5 TMG</p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Angaben zum Betreiber</h3>
                  <div className="rounded-lg border p-4 bg-card/50">
                    <p className="font-medium">Maik Zschach</p>
                    <p>Merianstraße 8</p>
                    <p>33615 Bielefeld</p>
                    <p>Deutschland</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Kontakt</h3>
                  <div className="rounded-lg border p-4 bg-card/50">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <a href="mailto:maik.z@gmx.de" className="text-primary hover:underline">
                        maik.z@gmx.de
                      </a>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Datenschutz</h3>
                  <div className="rounded-lg border p-4 bg-card/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <Link to="/privacy" className="text-primary hover:underline font-medium">
                        Zur Datenschutzerklärung
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Informationen zum Umgang mit Ihren Daten und zu Ihren Rechten finden Sie in unserer Datenschutzerklärung.
                    </p>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/privacy" className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Datenschutzerklärung öffnen
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">CSAE Richtlinien</h3>
                  <div className="rounded-lg border p-4 bg-card/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <Link to="/csae-policies" className="text-primary hover:underline font-medium">
                        Zu den CSAE Richtlinien
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Informationen zu unseren Community Standards und Event-Ethik finden Sie in unseren CSAE Richtlinien.
                    </p>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/csae-policies" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          CSAE Richtlinien öffnen
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Haftungsausschluss</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
                    </p>
                    <p>
                      Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                    </p>
                    <p>
                      Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-sm text-muted-foreground">
                <p>Stand: {new Date().toLocaleDateString('de-CH')}</p>
              </div>
            </div>
          </section>
          
          <section className="text-center">
            <p className="text-muted-foreground">
              &copy; {new Date().getFullYear()} THE TRIBE.BI • Mit ♥ in Bielefeld erstellt
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

const features = [
  {
    title: "Echte Begegnungen",
    description: "Entdecke Veranstaltungen, die Menschen im echten Leben zusammenbringen und neue Freundschaften entstehen lassen.",
    icon: Calendar
  },
  {
    title: "Lokale Gemeinschaft",
    description: "Werde Teil einer wachsenden Community von Menschen, die Bielefeld aktiv und lebendig gestalten wollen.",
    icon: Users
  },
  {
    title: "Ideen teilen",
    description: "Bring deine eigenen Veranstaltungen ein und teile deine Leidenschaften mit Gleichgesinnten.",
    icon: MessageSquare
  },
  {
    title: "Stadt beleben",
    description: "Gemeinsam machen wir Bielefeld zu einem Ort voller spannender Möglichkeiten und Erlebnisse.",
    icon: Heart
  },
  {
    title: "Immer informiert",
    description: "Verpasse keine Events mehr und bleibe stets auf dem Laufenden, was in deiner Stadt passiert.",
    icon: Clock
  },
  {
    title: "Von Bielefeldernz für Bielefelder",
    description: "Unsere Community lebt vom Engagement lokaler Menschen, die ihre Stadt lieben.",
    icon: MapPin
  }
];

const partnershipOptions = [
  {
    title: "Premium Event Posting",
    description: "Hebe deine Veranstaltungen hervor mit besserer Sichtbarkeit und Platzierung in unserem Kalender.",
    icon: Calendar
  },
  {
    title: "Workshop & Talks",
    description: "Präsentiere dein Fachwissen und erreiche engagierte Teilnehmer in der Bielefelder Community.",
    icon: Users
  },
  {
    title: "Lokale Werbung",
    description: "Stelle deine Marke der Bielefelder Community vor und nutze unsere lokale Reichweite.",
    icon: Heart
  },
];

export default About;
