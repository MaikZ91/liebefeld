
import React from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CSAEPolicies = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <CalendarNavbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link to="/impressum">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Zurück zum Impressum
            </Button>
          </Link>
        </div>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">CSAE Richtlinien</h1>
            <div className="h-1 w-20 bg-primary/70 rounded mb-6"></div>
            <p className="text-muted-foreground mb-2">Stand: {new Date().toLocaleDateString('de-CH')}</p>
          </div>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-2">1. Allgemeine Grundsätze</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Zweck der Richtlinien</h3>
                  <p className="text-sm text-muted-foreground">
                    Die CSAE Richtlinien (Community Standards and Event Ethics) stellen sicher, dass alle Events in unserer Community bestimmten Qualitäts- und Ethikstandards entsprechen. Sie dienen zum Schutz aller Teilnehmer und zur Förderung einer positiven, inklusiven Gemeinschaft.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Anwendungsbereich</h3>
                  <p className="text-sm text-muted-foreground">
                    Diese Richtlinien gelten für alle Events, die über unsere Plattform beworben oder organisiert werden, unabhängig von ihrer Größe oder Art.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">2. Verhaltenskodex für Events</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Inklusion und Respekt</h3>
                  <p className="text-sm text-muted-foreground">
                    Alle Events müssen einen inklusiven Charakter haben und Diskriminierung jeglicher Art unterlassen. Dies umfasst, ist aber nicht beschränkt auf, Diskriminierung aufgrund von Geschlecht, sexueller Orientierung, Alter, Religion, Herkunft, Behinderung oder sozialer Stellung.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Sicherheit</h3>
                  <p className="text-sm text-muted-foreground">
                    Veranstalter sind verpflichtet, angemessene Sicherheitsvorkehrungen zu treffen und die geltenden Sicherheitsvorschriften einzuhalten. Das Wohlbefinden aller Teilnehmer steht im Vordergrund.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Umweltbewusstsein</h3>
                  <p className="text-sm text-muted-foreground">
                    Wir ermutigen Veranstalter, umweltfreundliche Praktiken anzuwenden und den ökologischen Fußabdruck ihrer Events zu minimieren.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">3. Inhaltsrichtlinien</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Verbotene Inhalte</h3>
                  <p className="text-sm text-muted-foreground">
                    Events dürfen keine illegalen Aktivitäten fördern oder enthalten. Dazu gehören unter anderem:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                    <li>Gewaltverherrlichung</li>
                    <li>Hassrede oder -propaganda</li>
                    <li>Explizit sexuelle Inhalte (außer in entsprechend gekennzeichneten Veranstaltungen für Erwachsene)</li>
                    <li>Verstöße gegen geistiges Eigentum</li>
                    <li>Aktivitäten, die gegen geltendes Recht verstoßen</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Transparenz</h3>
                  <p className="text-sm text-muted-foreground">
                    Eventbeschreibungen müssen klar und genau sein. Alle relevanten Informationen wie Kosten, Einschränkungen oder besondere Anforderungen sollten deutlich angegeben werden.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">4. Berichterstattung und Durchsetzung</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Meldung von Verstößen</h3>
                  <p className="text-sm text-muted-foreground">
                    Nutzer können Verstöße gegen diese Richtlinien melden. Wir nehmen alle Meldungen ernst und überprüfen sie sorgfältig.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Konsequenzen bei Verstößen</h3>
                  <p className="text-sm text-muted-foreground">
                    Je nach Schwere des Verstoßes können verschiedene Maßnahmen ergriffen werden, von Warnungen über die Entfernung von Events bis hin zum Ausschluss von Organisatoren von unserer Plattform.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">5. Änderungen und Aktualisierungen</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Diese Richtlinien können regelmäßig aktualisiert werden, um neue Entwicklungen und Erkenntnisse zu berücksichtigen. Es liegt in der Verantwortung der Nutzer, sich über die aktuellen Richtlinien zu informieren.
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

export default CSAEPolicies;
