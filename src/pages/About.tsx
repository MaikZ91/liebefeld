
import React, { useEffect } from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BadgeCheck, Calendar, Clock, Heart, Link, Mail, MapPin, MessageSquare, Users } from 'lucide-react';

const About = () => {
  // Add smooth scroll-in animation effect on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
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
                <div className="relative">
                  <div className="glass-card rounded-2xl overflow-hidden aspect-[4/3]">
                    <img 
                      src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
                      alt="Community Gathering" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-5 -right-5 glass-card rounded-2xl p-4 shadow-lg animate-float">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-primary h-5 w-5" />
                      <p className="font-medium">Gemeinsam erleben</p>
                    </div>
                  </div>
                </div>
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
          
          {/* Partner Section */}
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
                <Button variant="outline" className="rounded-full gap-2">
                  <Link className="h-4 w-4" />
                  Mehr erfahren
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
          
          {/* Impressum Section */}
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
                      <p>mschach@googlemail.com</p>
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

export default About;

