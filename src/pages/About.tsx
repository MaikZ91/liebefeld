import React, { useEffect } from 'react';
import CalendarNavbar from '@/components/CalendarNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MessageSquare, Users, Heart, Link as LinkIcon, Globe, Star, Award, PartyPopper } from 'lucide-react';
import ImageCarousel from '@/components/ImageCarousel';
import { Link, useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();
  
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
          {/* Hero Section */}
          <section className="py-20 mb-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-black z-0"></div>
            <div className="absolute inset-0 bg-[url('/lovable-uploads/2653c557-0afe-4690-9d23-0b523cb09e3e.png')] bg-cover bg-center opacity-20 z-[-1]"></div>
            
            <div className="relative z-10 text-center max-w-4xl mx-auto">
              <span className="inline-block py-1 px-3 rounded-full bg-red-500/20 text-red-400 text-sm font-medium mb-4">Bielefelds Community-Plattform</span>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-500">THE TRIBE.BI</h1>
              <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
                Entdecke lokale Events, verbinde dich mit der Community und erlebe ein lebendigeres Bielefeld.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  className="rounded-full px-8 py-6 text-lg bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                  size="lg"
                  onClick={() => navigate('/chat')}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Events entdecken
                </Button>
                <Button 
                  variant="outline"
                  className="rounded-full px-8 py-6 text-lg border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  size="lg"
                  onClick={() => {
                    // Open chat with a specific query
                    if (typeof window !== 'undefined' && window.chatbotQuery) {
                      window.chatbotQuery('Was für Events gibt es heute?');
                      navigate('/chat');
                    } else {
                      navigate('/chat');
                    }
                  }}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Event-Assistent fragen
                </Button>
              </div>
              
              <div className="mt-16 flex items-center justify-center space-x-6">
                <div className="flex -space-x-4">
                  {communityImages.map((img, index) => (
                    <div key={index} className="w-12 h-12 rounded-full border-2 border-black overflow-hidden">
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-white/70 text-sm">+500 Community-Mitglieder</p>
              </div>
            </div>
          </section>
          
          {/* Features Section */}
          <section className="mb-24">
            <div className="text-center mb-16">
              <span className="inline-block py-1 px-3 rounded-full bg-secondary text-sm font-medium mb-4">Unsere Plattform</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Alles was du für ein lebendiges Bielefeld brauchst</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Mit unseren Tools machst du aus deiner Stadt ein Zuhause voller Möglichkeiten und Verbindungen
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="glass-card hover-scale transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10 border-red-500/10">
                  <CardContent className="p-8">
                    <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                      <feature.icon className="h-7 w-7 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          
          {/* Event Assistant Highlight */}
          <section className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <span className="inline-block py-1 px-3 rounded-full bg-red-500/20 text-red-400 text-sm font-medium mb-4">KI-Powered Event-Assistent</span>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Finde Events mit deinem persönlichen Assistent</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Unser KI-Assistent hilft dir, genau die Events zu finden, die zu dir passen. Egal ob du nach Konzerten, Workshops oder Community-Treffen suchst - frag einfach nach!
                </p>
                
                <div className="space-y-4">
                  {assistantFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="mr-4 h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <feature.icon className="h-3 w-3 text-red-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="mt-8 rounded-full px-6 bg-red-500 hover:bg-red-600"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.chatbotQuery) {
                      window.chatbotQuery('Welche Konzerte gibt es diese Woche?');
                      navigate('/chat');
                    } else {
                      navigate('/chat');
                    }
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Assistent jetzt testen
                </Button>
              </div>
              
              <div className="order-1 lg:order-2 bg-black/50 p-6 rounded-xl border border-red-500/10 shadow-xl">
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="bg-zinc-900/80 max-w-[85%] rounded-lg p-3 border border-zinc-700/30">
                    <div>
                      <div className="mb-2 font-medium">Event-Assistent</div>
                      <p className="text-sm">
                        Hallo! Ich bin dein persönlicher Event-Assistent für Bielefeld. Wie kann ich dir heute helfen?
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-red-500/10 dark:bg-red-950/30 border border-red-500/20 rounded-lg p-3 ml-auto max-w-[85%]">
                    <p className="text-sm">Welche Konzerte gibt es diese Woche in Bielefeld?</p>
                  </div>
                  
                  <div className="bg-zinc-900/80 max-w-[85%] rounded-lg p-3 border border-zinc-700/30">
                    <div>
                      <div className="mb-2 font-medium">Event-Assistent</div>
                      <p className="text-sm mb-2">
                        Hier sind die Konzerte diese Woche in Bielefeld:
                      </p>
                      <div className="space-y-2">
                        <div className="p-2 bg-black/30 rounded border border-red-500/10 text-sm">
                          <div className="font-medium">Electric Circle Vol.3</div>
                          <div className="text-xs text-red-400">Fr, 20:00 Uhr | Lokschuppen</div>
                        </div>
                        <div className="p-2 bg-black/30 rounded border border-red-500/10 text-sm">
                          <div className="font-medium">Indie Night</div>
                          <div className="text-xs text-red-400">Sa, 21:00 Uhr | Forum</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Community Section */}
          <section className="mb-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="relative">
                  <ImageCarousel images={communityImages} autoSlideInterval={5000} />
                  <div className="absolute -bottom-4 -right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    <div className="font-bold">Live Community-Chat</div>
                    <div className="text-xs">500+ aktive Mitglieder</div>
                  </div>
                </div>
              </div>
              
              <div>
                <span className="inline-block py-1 px-3 rounded-full bg-red-500/20 text-red-400 text-sm font-medium mb-4">Community-Chat</span>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Verbinde dich mit Gleichgesinnten in Bielefeld</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  In unserem Community-Chat triffst du auf Menschen aus Bielefeld, die deine Interessen teilen. Tausche dich aus, finde neue Freunde und entdecke gemeinsam die Stadt.
                </p>
                
                <div className="space-y-4">
                  {communityFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="mr-4 h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <feature.icon className="h-3 w-3 text-red-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  className="mt-8 rounded-full px-6 bg-red-500 hover:bg-red-600"
                  onClick={() => navigate('/chat')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Community beitreten
                </Button>
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="mb-24">
            <div className="glass-card rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-purple-900/20 z-0"></div>
              <div className="relative z-10">
                <span className="inline-block py-1 px-3 rounded-full bg-red-500/20 text-red-400 text-sm font-medium mb-4">
                  Mach mit!
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Erlebe ein lebendigeres Bielefeld</h2>
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                  Sei Teil unserer Bewegung für ein lebendigeres Bielefeld! Entdecke spannende Events, 
                  triff neue Menschen und bringe deine eigenen Ideen ein.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    className="rounded-full shadow-md hover:shadow-lg transition-all bg-red-500 hover:bg-red-600 px-8 py-6"
                    size="lg"
                    onClick={() => navigate('/chat')}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    Events entdecken
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 px-8 py-6"
                    size="lg"
                    onClick={() => navigate('/chat')}
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Community beitreten
                  </Button>
                </div>
              </div>
            </div>
          </section>
          
          {/* Footer Links */}
          <section className="text-center mb-8">
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <Link to="/about" className="text-red-400 hover:text-red-300 transition-colors">
                Über uns
              </Link>
              <Link to="/impressum" className="text-red-400 hover:text-red-300 transition-colors">
                Impressum
              </Link>
              <Link to="/privacy" className="text-red-400 hover:text-red-300 transition-colors">
                Datenschutz
              </Link>
              <Link to="/csae-policies" className="text-red-400 hover:text-red-300 transition-colors">
                CSAE Richtlinien
              </Link>
            </div>
            
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
    title: "Event-Kalender",
    description: "Entdecke alle lokalen Veranstaltungen übersichtlich in unserem Community-Kalender.",
    icon: Calendar
  },
  {
    title: "KI Event-Assistent",
    description: "Frage unseren Assistenten nach passenden Events und erhalte personalisierte Empfehlungen.",
    icon: MessageSquare
  },
  {
    title: "Community-Chat",
    description: "Verbinde dich mit anderen Bielefeldern und tausche dich in Echtzeit aus.",
    icon: Users
  },
  {
    title: "Lokale Gemeinschaft",
    description: "Werde Teil einer wachsenden Community von Menschen, die Bielefeld aktiv gestalten.",
    icon: Heart
  },
  {
    title: "Event-Organisation",
    description: "Erstelle und teile deine eigenen Veranstaltungen mit der Community.",
    icon: Calendar
  },
  {
    title: "Lokale Verbindungen",
    description: "Knüpfe neue Kontakte zu Menschen in deiner Nähe mit ähnlichen Interessen.",
    icon: Globe
  }
];

const assistantFeatures = [
  {
    title: "Personalisierte Empfehlungen",
    description: "Erhalte Event-Vorschläge basierend auf deinen Interessen und Vorlieben.",
    icon: Star
  },
  {
    title: "Einfache Konversation",
    description: "Frage in natürlicher Sprache nach Events oder bestimmten Kategorien.",
    icon: MessageSquare
  },
  {
    title: "Aktuelle Informationen",
    description: "Immer auf dem neuesten Stand mit aktuellen Daten zu allen Veranstaltungen.",
    icon: Globe
  },
  {
    title: "Detaillierte Antworten",
    description: "Erhalte alle wichtigen Informationen zu den Events auf einen Blick.",
    icon: Award
  }
];

const communityFeatures = [
  {
    title: "Echte Verbindungen",
    description: "Lerne Menschen kennen, die deine Interessen teilen und in deiner Nähe leben.",
    icon: Users
  },
  {
    title: "Gruppenunterhaltungen",
    description: "Diskutiere in thematischen Chatgruppen über Musik, Kunst, Sport und mehr.",
    icon: MessageSquare
  },
  {
    title: "Event-Planung",
    description: "Organisiere spontane Treffen oder plane gemeinsame Teilnahmen an Events.",
    icon: Calendar
  },
  {
    title: "Community-Aktivitäten",
    description: "Nimm an regelmäßigen Community-Events und Stammtischen teil.",
    icon: PartyPopper
  }
];

export default About;
