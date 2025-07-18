
import React from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Impressum = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <CalendarNavbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link to="/about">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Zurück zu Über uns
            </Button>
          </Link>
        </div>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Impressum</h1>
            <div className="h-1 w-20 bg-primary/70 rounded mb-6"></div>
            <p className="text-muted-foreground mb-2">Gemäß § 5 TMG</p>
          </div>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-2">Angaben zum Betreiber</h2>
              <div className="rounded-lg border p-4 bg-card">
                <p className="font-medium">Maik Zschach</p>
                <p>Merianstraße 8</p>
                <p>33615 Bielefeld</p>
                <p>Deutschland</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">Kontakt</h2>
              <div className="rounded-lg border p-4 bg-card space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <p>mschach@googlemail.com</p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">Verantwortlich für den Inhalt</h2>
              <div className="rounded-lg border p-4 bg-card">
                <p>Maik Zschach</p>
                <p>Adresse wie oben</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">Datenschutz</h2>
              <div className="rounded-lg border p-4 bg-card space-y-2">
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
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">CSAE Richtlinien</h2>
              <div className="rounded-lg border p-4 bg-card space-y-2">
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
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">Haftungsausschluss</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Haftung für Inhalte</h3>
                  <p className="text-sm text-muted-foreground">
                    Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Haftung für Links</h3>
                  <p className="text-sm text-muted-foreground">
                    Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                  </p>
                </div>
              </div>
            </section>
          </div>
          
          <div className="border-t pt-4 text-sm text-muted-foreground">
            <p>Stand: {new Date().toLocaleDateString('de-CH')}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Impressum;
