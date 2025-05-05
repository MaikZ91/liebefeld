
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
        <div className="container mx-auto px-4 py-6 max-w-5xl animate-fade-in">
          {/* Hero Section - Kompakter */}
          <section className="py-12 mb-12 relative overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-black z-0"></div>
            <div className="absolute inset-0 bg-[url('/lovable-uploads/2653c557-0afe-4690-9d23-0b523cb09e3e.png')] bg-cover bg-center opacity-20 z-[-1]"></div>
            
            <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-500">THE TRIBE.BI</h1>
              <p className="text-lg md:text-xl text-white/80 mb-6 max-w-2xl mx-auto">
                Entdecke lokale Events, verbinde dich mit der Community und erlebe ein lebendigeres Bielefeld.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3">
                <Button 
                  className="rounded-full px-6 py-2 text-sm bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                  onClick={() => navigate('/chat')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Events entdecken
                </Button>
                <Button 
                  variant="outline"
                  className="rounded-full px-6 py-2 text-sm border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.chatbotQuery) {
                      window.chatbotQuery('Was für Events gibt es heute?');
                      navigate('/chat');
                    } else {
                      navigate('/chat');
                    }
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  AI-Assistent
                </Button>
              </div>
              
              <div className="mt-8 flex items-center justify-center space-x-4">
                <div className="flex -space-x-3">
                  {communityImages.slice(0, 3).map((img, index) => (
                    <div key={index} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden">
                      <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <p className="text-white/70 text-xs">+500 Community-Mitglieder</p>
              </div>
            </div>
          </section>
          
          {/* Features Section - Kompaktere Karten */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Was THE TRIBE bietet</h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Alles was du für ein lebendiges Bielefeld brauchst
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="hover-scale transition-all duration-300 hover:shadow-md hover:shadow-red-500/10 border-red-500/10">
                  <CardContent className="p-4">
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                      <feature.icon className="h-5 w-5 text-red-500" />
                    </div>
                    <h3 className="text-base font-bold mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
          
          {/* Combined Event Calendar & AI Assistant Section */}
          <section className="mb-16">
            <div className="bg-black/40 p-6 rounded-xl border border-red-500/10 shadow-lg">
              <span className="inline-block py-1 px-2 rounded-full bg-red-500/20 text-red-400 text-xs font-medium mb-2">KI-Event-Plattform</span>
              <h2 className="text-xl font-bold mb-3">Dein persönlicher Event-Assistent</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Mit der Kombination aus Event-Kalender und KI-Assistent findest du genau die Events, die zu dir passen
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Left: Calendar Preview */}
                <div className="relative h-48 bg-black/40 rounded-lg overflow-hidden border border-red-500/10">
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-black/60">
                    <Calendar className="h-20 w-20 text-red-500/20 absolute" />
                    <div className="relative z-10 text-center p-3">
                      <h4 className="font-medium text-sm mb-1">Event-Kalender</h4>
                      <p className="text-xs text-red-300/70">Alle lokalen Events auf einen Blick</p>
                      <div className="mt-3 flex flex-wrap gap-1 justify-center">
                        <span className="text-[8px] bg-red-500/10 px-1 py-0.5 rounded">Electric Circle Vol.3</span>
                        <span className="text-[8px] bg-red-500/10 px-1 py-0.5 rounded">Tribe Stammtisch</span>
                        <span className="text-[8px] bg-red-500/10 px-1 py-0.5 rounded">+15 mehr</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right: Chat Preview */}
                <div className="space-y-2">
                  <div className="bg-zinc-900/80 max-w-[95%] rounded-lg p-2 border border-zinc-700/30">
                    <p className="text-xs">
                      Welche Konzerte gibt es diese Woche in Bielefeld?
                    </p>
                  </div>
                  
                  <div className="bg-red-500/10 dark:bg-red-950/30 border border-red-500/20 rounded-lg p-2 ml-auto max-w-[95%]">
                    <div className="text-xs space-y-1">
                      <p className="mb-1">
                        Hier sind die Konzerte diese Woche:
                      </p>
                      <div className="p-1 bg-black/30 rounded border border-red-500/10">
                        <div className="font-medium">Electric Circle Vol.3</div>
                        <div className="text-[10px] text-red-400">Fr, 20:00 | Lokschuppen</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-center gap-3">
                <Button 
                  className="w-full md:w-auto rounded-full px-4 py-1 text-xs bg-red-500 hover:bg-red-600"
                  onClick={() => navigate('/chat')}
                >
                  <Calendar className="mr-1 h-3 w-3" />
                  Events entdecken
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto rounded-full px-4 py-1 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.chatbotQuery) {
                      window.chatbotQuery('Welche Konzerte gibt es diese Woche?');
                      navigate('/chat');
                    } else {
                      navigate('/chat');
                    }
                  }}
                >
                  <MessageSquare className="mr-1 h-3 w-3" />
                  AI-Assistent fragen
                </Button>
              </div>
            </div>
          </section>
          
          {/* Community Section */}
          <section className="mb-16">
            <div className="bg-black/40 p-6 rounded-xl border border-red-500/10 shadow-lg">
              <span className="inline-block py-1 px-2 rounded-full bg-red-500/20 text-red-400 text-xs font-medium mb-2">Community</span>
              <h2 className="text-xl font-bold mb-3">Verbinde dich mit Gleichgesinnten</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Tausche dich mit Menschen aus Bielefeld aus, die deine Interessen teilen
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                {communityImages.slice(0, 3).map((img, index) => (
                  <div key={index} className="h-32 rounded-lg overflow-hidden">
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                {communityFeatures.slice(0, 4).map((feature, i) => (
                  <div key={i} className="flex items-start">
                    <div className="mr-1 h-4 w-4 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                      <feature.icon className="h-2 w-2" />
                    </div>
                    <div className="text-xs">{feature.title}</div>
                  </div>
                ))}
              </div>
              
              <Button 
                className="w-full mt-4 rounded-full px-4 py-1 text-xs bg-red-500 hover:bg-red-600"
                onClick={() => navigate('/chat')}
              >
                <Users className="mr-1 h-3 w-3" />
                Community beitreten
              </Button>
            </div>
          </section>
          
          {/* CTA Section - Kompakter */}
          <section className="mb-12">
            <div className="rounded-xl p-6 text-center relative overflow-hidden bg-gradient-to-r from-red-950/30 to-purple-950/30">
              <h2 className="text-2xl font-bold mb-3">Erlebe ein lebendigeres Bielefeld</h2>
              <p className="text-base text-muted-foreground max-w-xl mx-auto mb-4">
                Sei Teil unserer Bewegung! Entdecke Events und triff neue Menschen.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button 
                  className="rounded-full shadow-md hover:shadow-lg transition-all bg-red-500 hover:bg-red-600 px-6"
                  onClick={() => navigate('/chat')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Events entdecken
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 px-6"
                  onClick={() => navigate('/chat')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Community beitreten
                </Button>
              </div>
            </div>
          </section>
          
          {/* Footer Links - Kompakter */}
          <section className="text-center mb-6">
            <div className="flex flex-wrap justify-center gap-4 mb-3">
              <Link to="/about" className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Über uns
              </Link>
              <Link to="/impressum" className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Impressum
              </Link>
              <Link to="/privacy" className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Datenschutz
              </Link>
              <Link to="/csae-policies" className="text-xs text-red-400 hover:text-red-300 transition-colors">
                CSAE Richtlinien
              </Link>
            </div>
            
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} THE TRIBE.BI • Mit ♥ in Bielefeld
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

// Features für die Feature-Section
const features = [
  {
    title: "Event-Kalender & KI-Assistent",
    description: "Entdecke lokale Events und erhalte personalisierte Empfehlungen.",
    icon: Calendar
  },
  {
    title: "Community",
    description: "Verbinde dich mit anderen Bielefeldern in Echtzeit.",
    icon: Users
  },
  {
    title: "Gemeinschaft",
    description: "Werde Teil einer wachsenden lokalen Community.",
    icon: Heart
  },
  {
    title: "Events erstellen",
    description: "Teile deine eigenen Veranstaltungen mit der Community.",
    icon: Calendar
  },
  {
    title: "Lokale Kontakte",
    description: "Knüpfe neue Kontakte zu Menschen in deiner Nähe.",
    icon: Globe
  }
];

// Features für die Assistant-Features
const assistantFeatures = [
  {
    title: "Personalisierte Empfehlungen",
    description: "Erhalte Event-Vorschläge basierend auf deinen Interessen.",
    icon: Star
  },
  {
    title: "Einfache Konversation",
    description: "Frage in natürlicher Sprache nach Events oder Kategorien.",
    icon: MessageSquare
  },
  {
    title: "Aktuelle Informationen",
    description: "Immer auf dem neuesten Stand mit aktuellen Event-Daten.",
    icon: Globe
  },
  {
    title: "Detaillierte Antworten",
    description: "Erhalte alle wichtigen Informationen zu Events auf einen Blick.",
    icon: Award
  }
];

// Features für die Community-Features
const communityFeatures = [
  {
    title: "Echte Verbindungen",
    description: "Lerne Menschen kennen, die deine Interessen teilen.",
    icon: Users
  },
  {
    title: "Gruppen-Chats",
    description: "Diskutiere in thematischen Chatgruppen über gemeinsame Interessen.",
    icon: MessageSquare
  },
  {
    title: "Event-Planung",
    description: "Organisiere spontane Treffen oder plane gemeinsame Teilnahmen.",
    icon: Calendar
  },
  {
    title: "Community-Events",
    description: "Nimm an regelmäßigen Community-Events und Stammtischen teil.",
    icon: PartyPopper
  }
];

export default About;
