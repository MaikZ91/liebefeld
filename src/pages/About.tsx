
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import CalendarNavbar from '@/components/CalendarNavbar';
import { 
  Download, 
  Calendar, 
  Users, 
  MessageSquare, 
  Globe, 
  LinkIcon, 
  Heart, 
  TestTube, 
  Star,
  Award,
  PartyPopper
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CommunityTest from '@/components/CommunityTest';

const About = () => {
  const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=co.median.android.yadezx";
  const WHATSAPP_URL = "https://chat.whatsapp.com/invite/yourlinkhere"; // Replace with your actual WhatsApp URL
  const [testModalOpen, setTestModalOpen] = useState(false);
  const navigate = useNavigate();

  // Sample community images for the demo
  const communityImages = [
    { src: "/lovable-uploads/e3d0a85b-9935-450a-bba8-5693570597a3.png", alt: "Community event 1" },
    { src: "/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png", alt: "Community event 2" },
    { src: "/lovable-uploads/8562fff2-2b62-4552-902b-cc62457a3402.png", alt: "Community event 3" },
    { src: "/lovable-uploads/764c9b33-5d7d-4134-b503-c77e23c469f9.png", alt: "Community event 4" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <CalendarNavbar />
      
      {/* App Download Banner */}
      <div className="w-full bg-gradient-to-r from-[#1A1F2C] to-[#9b87f5] py-6 shadow-lg">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 font-serif">Erlebe den Community Kalender als App</h2>
            <p className="text-gray-100 mb-4">Entdecke Events, bleibe verbunden und verpasse nie wieder ein Highlight in deiner Umgebung.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Button
              onClick={() => window.open(PLAY_STORE_URL, '_blank')}
              className="bg-[#F97316] hover:bg-orange-600 text-white rounded-lg px-6 py-6 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all gap-2 min-w-48"
              size="lg"
            >
              <Download className="h-5 w-5" />
              <span className="font-bold">App herunterladen</span>
            </Button>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="block transform hover:scale-105 transition-transform">
              <img
                src="/lovable-uploads/8413f0b2-fdba-4473-a257-bb471b29ea95.png"
                alt="Get it on Google Play"
                className="h-14 shadow-md rounded"
              />
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl animate-fade-in">
        {/* Hero Section - Updated with CTA content */}
        <section className="py-12 mb-12 relative overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-black z-0"></div>
          <div className="absolute inset-0 bg-[url('/lovable-uploads/2653c557-0afe-4690-9d23-0b523cb09e3e.png')] bg-cover bg-center opacity-20 z-[-1]"></div>
          
          <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-500">THE TRIBE.BI</h1>
            <p className="text-lg md:text-xl text-white/80 mb-6 max-w-2xl mx-auto">
              Erlebe ein lebendigeres Bielefeld. Sei Teil unserer Bewegung! Entdecke Events und triff neue Menschen.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <Button 
                className="rounded-full px-6 py-2 text-sm bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                onClick={() => setTestModalOpen(true)}
              >
                <Users className="mr-2 h-4 w-4" />
                Community beitreten
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
              <p className="text-white/70 text-xs">+100 Community-Mitglieder</p>
            </div>
          </div>
        </section>
        
        {/* Community Section - Moved up from original position */}
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
              onClick={() => setTestModalOpen(true)}
            >
              <Users className="mr-1 h-3 w-3" />
              Community beitreten
            </Button>
          </div>
        </section>
        
        {/* KI-Event-Plattform Section - Improved calendar and chat display, moved after Community */}
        <section className="mb-16">
          <div className="bg-black/40 p-6 rounded-xl border border-red-500/10 shadow-lg">
            <span className="inline-block py-1 px-2 rounded-full bg-red-500/20 text-red-400 text-xs font-medium mb-2">KI-Event-Plattform</span>
            <h2 className="text-xl font-bold mb-3">Dein persönlicher Event-Assistent</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Mit der Kombination aus Event-Kalender und KI-Assistent findest du genau die Events, die zu dir passen
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Left: Enhanced Calendar Preview */}
              <div className="relative bg-black/40 rounded-lg overflow-hidden border border-red-500/10 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="font-medium text-sm text-white">Event-Kalender</h4>
                  <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded-full text-red-400">Mai 2025</span>
                </div>
                
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {/* Day headers */}
                  {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                    <div key={day} className="text-center text-xs text-gray-400 p-1">{day}</div>
                  ))}
                  
                  {/* Calendar days (first row) */}
                  {[null, null, 1, 2, 3, 4, 5].map((day, i) => (
                    <div key={`week1-${i}`} className={`text-center p-1 text-xs rounded-full ${day === 3 ? 'bg-red-500 text-white' : day ? 'hover:bg-gray-800' : ''}`}>
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days (second row) */}
                  {[6, 7, 8, 9, 10, 11, 12].map((day, i) => (
                    <div key={`week2-${i}`} className={`text-center p-1 text-xs rounded-full ${day === 10 ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30' : 'hover:bg-gray-800'}`}>
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Event Cards */}
                <div className="space-y-2">
                  <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-2 hover-scale transition-all">
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium text-xs text-white">Electric Circle Vol.3</h5>
                      <span className="bg-black text-red-500 text-[10px] px-1.5 rounded">Konzert</span>
                    </div>
                    <div className="flex items-center mt-0.5 text-[10px] text-gray-300">
                      <Calendar className="w-2.5 h-2.5 mr-1" />
                      <span>Fr, 20:00 | Lokschuppen</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/40 border border-gray-700/30 rounded-lg p-2 hover-scale transition-all">
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium text-xs text-white">Tribe Stammtisch</h5>
                      <span className="bg-black text-blue-400 text-[10px] px-1.5 rounded">Community</span>
                    </div>
                    <div className="flex items-center mt-0.5 text-[10px] text-gray-300">
                      <Calendar className="w-2.5 h-2.5 mr-1" />
                      <span>Di, 19:00 | Café Barina</span>
                    </div>
                  </div>
                  
                  <div className="text-center text-xs text-red-400 hover:underline cursor-pointer">
                    +15 weitere Events anzeigen
                  </div>
                </div>
              </div>
              
              {/* Right: Enhanced Chat Preview */}
              <div className="bg-black/40 rounded-lg overflow-hidden border border-red-500/10 p-3">
                <div className="mb-2 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2 text-red-500" />
                  <h4 className="font-medium text-sm text-white">KI-Assistent</h4>
                </div>
                
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  <div className="bg-zinc-900/80 max-w-[90%] rounded-lg p-2 border border-zinc-700/30">
                    <p className="text-xs">
                      Welche Konzerte gibt es diese Woche in Bielefeld?
                    </p>
                  </div>
                  
                  <div className="bg-red-500/10 dark:bg-red-950/30 border border-red-500/20 rounded-lg p-2 ml-auto max-w-[90%]">
                    <div className="text-xs">
                      <p className="mb-1">
                        Hier sind die Konzerte diese Woche:
                      </p>
                      <div className="space-y-2">
                        <div className="p-2 bg-black/50 rounded-lg border border-red-500/10">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-white">Electric Circle Vol.3</div>
                              <div className="text-[10px] text-red-400 flex items-center">
                                <Calendar className="w-2.5 h-2.5 mr-1" />
                                Fr, 20:00 | Lokschuppen
                              </div>
                            </div>
                            <span className="bg-black text-red-500 text-[10px] px-1.5 rounded">Konzert</span>
                          </div>
                        </div>
                        
                        <div className="p-2 bg-black/50 rounded-lg border border-red-500/10">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium text-white">Jazz im Bunker</div>
                              <div className="text-[10px] text-red-400 flex items-center">
                                <Calendar className="w-2.5 h-2.5 mr-1" />
                                Sa, 21:00 | Bunker Ulmenwall
                              </div>
                            </div>
                            <span className="bg-black text-red-500 text-[10px] px-1.5 rounded">Konzert</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-zinc-900/80 max-w-[90%] rounded-lg p-2 border border-zinc-700/30">
                    <p className="text-xs">
                      Was für Bands spielen beim Electric Circle?
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 relative">
                  <div className="flex items-center bg-black/30 rounded-full border border-gray-700/50 px-3 py-1">
                    <input 
                      type="text" 
                      placeholder="Frage den KI-Assistenten..." 
                      className="bg-transparent text-xs w-full border-none focus:outline-none text-white"
                      readOnly
                    />
                    <MessageSquare className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
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

        {/* Features Section - More compact version */}
        <section className="mb-12">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold mb-1">Was THE TRIBE bietet</h2>
            <p className="text-sm text-muted-foreground">
              Alles was du für ein lebendiges Bielefeld brauchst
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div key={index} className="bg-black/40 p-3 rounded-lg border border-red-500/10 flex items-start">
                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center mr-3 flex-shrink-0">
                  <feature.icon className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-0.5">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Werde Partner Section - Shortened version */}
        <section className="mb-8">
          <div className="bg-black/40 p-6 rounded-xl border border-red-500/10 shadow-lg">
            <span className="inline-block py-1 px-2 rounded-full bg-red-500/20 text-red-400 text-xs font-medium mb-2">Werde Partner</span>
            <h2 className="text-xl font-bold mb-3">Unterstütze lokale Events</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/40 rounded-lg p-3 border border-red-500/10 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                  <Calendar className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="font-medium text-sm mb-1">Event-Sponsoring</h3>
                <p className="text-xs text-gray-400">Unterstütze lokale Events</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-3 border border-red-500/10 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                  <Globe className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="font-medium text-sm mb-1">Venue-Partnerschaften</h3>
                <p className="text-xs text-gray-400">Als Veranstaltungsort</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-3 border border-red-500/10 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                  <LinkIcon className="h-5 w-5 text-red-500" />
                </div>
                <h3 className="font-medium text-sm mb-1">Kooperationen</h3>
                <p className="text-xs text-gray-400">Erschließe neue Zielgruppen</p>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <Button 
                className="rounded-full px-4 py-1 text-xs bg-red-500 hover:bg-red-600"
                onClick={() => navigate('/chat')}
              >
                Partner werden
              </Button>
            </div>
          </div>
        </section>
        
        {/* Social Tides Section - Shortened version */}
        <section className="mb-12">
          <div className="bg-black/40 p-6 rounded-xl border border-purple-500/10 shadow-lg">
            <span className="inline-block py-1 px-2 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium mb-2">Social Tides</span>
            <h2 className="text-xl font-bold mb-3">Soziale Initiativen unterstützen</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/40 rounded-lg p-4 border border-purple-500/10">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                    <Heart className="h-4 w-4 text-purple-400" />
                  </div>
                  <h3 className="font-medium text-sm">Gemeinnützige Events</h3>
                </div>
                <p className="text-xs text-gray-400">Unterstütze lokale Initiativen und nimm an Events mit sozialem Impact teil.</p>
              </div>
              
              <div className="bg-black/40 rounded-lg p-4 border border-purple-500/10">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                    <TestTube className="h-4 w-4 text-purple-400" />
                  </div>
                  <h3 className="font-medium text-sm">Nachhaltige Projekte</h3>
                </div>
                <p className="text-xs text-gray-400">Beteilige dich an Projekten für ein zukunftsfähiges Bielefeld.</p>
              </div>
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
      
      <CommunityTest 
        open={testModalOpen} 
        onOpenChange={setTestModalOpen} 
        whatsappUrl={WHATSAPP_URL} 
      />
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
    description: "Verbinde dich mit anderen Bielefeldern und werde Teil einer wachsenden lokalen Community.",
    icon: Users
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
