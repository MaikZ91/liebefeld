
import React from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Privacy = () => {
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
            <h1 className="text-3xl font-bold mb-4">Datenschutzerklärung</h1>
            <div className="h-1 w-20 bg-primary/70 rounded mb-6"></div>
            <p className="text-muted-foreground mb-2">Stand: {new Date().toLocaleDateString('de-CH')}</p>
          </div>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-2">1. Datenschutz auf einen Blick</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Allgemeine Hinweise</h3>
                  <p className="text-sm text-muted-foreground">
                    Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Datenerfassung auf dieser Website</h3>
                  <p className="text-sm text-muted-foreground">
                    Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Die Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">2. Allgemeine Hinweise und Pflichtinformationen</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Datenschutz</h3>
                  <p className="text-sm text-muted-foreground">
                    Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Hinweis zur verantwortlichen Stelle</h3>
                  <p className="text-sm text-muted-foreground">
                    Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:<br />
                    <span className="font-medium">Maik Zschach</span><br />
                    Merianstraße 8<br />
                    33615 Bielefeld<br />
                    Deutschland<br /><br />
                    E-Mail: mschach@googlemail.com
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">3. Datenerfassung auf dieser Website</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    Unsere Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem Rechner keinen Schaden an und enthalten keine Viren. Cookies dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen. Cookies sind kleine Textdateien, die auf Ihrem Rechner abgelegt werden und die Ihr Browser speichert.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Server-Log-Dateien</h3>
                  <p className="text-sm text-muted-foreground">
                    Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground mt-2">
                    <li>Browsertyp und Browserversion</li>
                    <li>Verwendetes Betriebssystem</li>
                    <li>Referrer URL</li>
                    <li>Hostname des zugreifenden Rechners</li>
                    <li>Uhrzeit der Serveranfrage</li>
                    <li>IP-Adresse</li>
                  </ul>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">4. Plugins und Tools</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Google Web Fonts</h3>
                  <p className="text-sm text-muted-foreground">
                    Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten so genannte Web Fonts, die von Google bereitgestellt werden. Beim Aufruf einer Seite lädt Ihr Browser die benötigten Web Fonts in ihren Browsercache, um Texte und Schriftarten korrekt anzuzeigen.
                  </p>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-2">5. Ihre Rechte</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Auskunftsrecht</h3>
                  <p className="text-sm text-muted-foreground">
                    Sie haben das Recht, jederzeit Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten zu erhalten. Ebenso haben Sie das Recht auf Berichtigung, Sperrung oder, abgesehen von der vorgeschriebenen Datenspeicherung zur Geschäftsabwicklung, Löschung Ihrer personenbezogenen Daten.
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

export default Privacy;
