
import React, { useEffect } from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BadgeCheck, Calendar, Clock, Heart, Mail, MessageSquare, Users } from 'lucide-react';

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
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Community Event Kalender</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Ein Ort für gemeinsame Erlebnisse, Vernetzung und Wissensaustausch in unserer Community.
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
                      Wir möchten einen zentralen Ort schaffen, an dem Community-Mitglieder Events entdecken, 
                      teilen und gemeinsam erleben können. Unser Kalender verbindet Menschen mit ähnlichen 
                      Interessen und fördert den Austausch in der Gemeinschaft.
                    </p>
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold mb-3">Unsere Vision</h2>
                    <p className="text-muted-foreground">
                      Eine lebendige Community, in der jeder willkommen ist, Ideen und Wissen zu teilen. 
                      Wir träumen von einer Plattform, die Menschen zusammenbringt und gemeinsame Erlebnisse ermöglicht.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="order-1 md:order-2">
                <div className="relative">
                  <div className="glass-card rounded-2xl overflow-hidden aspect-[4/3]">
                    <img 
                      src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
                      alt="Community Gathering" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-5 -right-5 glass-card rounded-2xl p-4 shadow-lg animate-float">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-primary h-5 w-5" />
                      <p className="font-medium">Events verbinden uns</p>
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
          
          <section className="mb-16">
            <div className="glass-card rounded-2xl p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Mach mit!</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                Sei Teil unserer Community, entdecke spannende Events, teile deine eigenen Veranstaltungen und vernetze dich mit Gleichgesinnten.
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
              &copy; {new Date().getFullYear()} Community Event Kalender • Mit ♥ erstellt
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

const features = [
  {
    title: "Events entdecken",
    description: "Finde spannende Veranstaltungen in deiner Community und erweitere deinen Horizont.",
    icon: Calendar
  },
  {
    title: "Netzwerken",
    description: "Knüpfe Kontakte zu Gleichgesinnten und baue dein persönliches Netzwerk aus.",
    icon: Users
  },
  {
    title: "Wissen teilen",
    description: "Organisiere eigene Events und teile dein Wissen mit der Community.",
    icon: MessageSquare
  },
  {
    title: "Gemeinsam erleben",
    description: "Nimm an gemeinsamen Aktivitäten teil und schaffe bleibende Erinnerungen.",
    icon: Heart
  },
  {
    title: "Immer informiert",
    description: "Bleibe auf dem Laufenden über alle Veranstaltungen in deiner Community.",
    icon: Clock
  },
  {
    title: "Vertrauenswürdig",
    description: "Alle Events werden von Community-Mitgliedern erstellt und geteilt.",
    icon: BadgeCheck
  }
];

export default About;
