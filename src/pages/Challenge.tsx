import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { USERNAME_KEY } from '@/types/chatTypes';
import { Trophy, Target, Flame, CheckCircle } from 'lucide-react';

const ChallengePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const username = localStorage.getItem(USERNAME_KEY) || 'Anonymous';

  const startDate = new Date("2025-07-01");
  const today = new Date();
  const dayIndex = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.floor(dayIndex / 7) + 1;
  const currentChallengeIndex = dayIndex % 7;

  const allChallenges: { challenge: string; tip: string }[][] = [
    [
      { challenge: "Sag heute einer fremden Person Hallo.", tip: "Mach Augenkontakt und lächle dabei." },
      { challenge: "Halte Augenkontakt mit 3 Menschen heute.", tip: "Zähle innerlich bis 2." },
      { challenge: "Lächle drei fremde Menschen an.", tip: "Fang mit Verkäufer:innen oder Passanten an." },
      { challenge: "Sag Danke mit ehrlichem Blick.", tip: "Z.B. beim Aussteigen oder an der Kasse." },
      { challenge: "Halte Blickkontakt beim Smalltalk.", tip: "Z.B. im Fahrstuhl oder Flur." },
      { challenge: "Stell heute eine offene Frage.", tip: "Wie z.B.: 'Was bringt dich heute hierher?'" },
      { challenge: "Zähle, wie viele Menschen du anlächselst.", tip: "Ziel: mindestens 5." }
    ],
    [
      { challenge: "Mach jemandem ein ehrliches Kompliment.", tip: "Z.B. zur Kleidung oder Ausstrahlung." },
      { challenge: "Sprich jemanden in der Uni oder im Café an.", tip: "Frag nach einem Tipp oder einer Meinung." },
      { challenge: "Stell dich jemandem im Raum bewusst vor.", tip: "Sag deinen Namen + was du machst." },
      { challenge: "Starte Smalltalk in der Warteschlange.", tip: "Z.B. 'Ganz schön voll heute, oder?'" },
      { challenge: "Frag eine fremde Person nach dem Weg.", tip: "Tipp: selbst wenn du ihn kennst." },
      { challenge: "Sag jemandem 'Schönen Tag noch'.", tip: "Beobachte seine Reaktion." },
      { challenge: "Setz dich bewusst zu jemandem in der Mensa / Café.", tip: "Mit einem freundlichen Lächeln." }
    ],
    [
      { challenge: "Stell einer Person 3 offene Fragen.", tip: "Trainiere echtes Interesse." },
      { challenge: "Erzähl einem Fremden etwas von dir.", tip: "Z.B. ein Hobby oder ein Ziel." },
      { challenge: "Sag jemandem ehrlich, was du gerade fühlst.", tip: "Z.B. 'Ich bin gerade etwas nervös.'" },
      { challenge: "Beginne ein Gespräch im Bus/Zug.", tip: "Z.B. mit einer harmlosen Frage." },
      { challenge: "Mach jemandem ein ungewöhnliches Kompliment.", tip: "Z.B. zur Stimme oder Haltung." },
      { challenge: "Sprich jemanden in einem Geschäft an.", tip: "Z.B. 'Was hältst du von dem Buch?'" },
      { challenge: "Geh alleine an einen öffentlichen Ort und komm mit jemandem ins Gespräch.", tip: "Z.B. im Park oder Museum." }
    ],
    [
      { challenge: "Starte ein Gespräch mit 2 Personen gleichzeitig.", tip: "Z.B. in der Raucherecke oder Bar." },
      { challenge: "Sprich jemanden auf seinen Style an.", tip: "Sei konkret und ehrlich." },
      { challenge: "Sprich jemanden mit Humor an.", tip: "Z.B. eine kreative Beobachtung." },
      { challenge: "Sag jemandem, dass er dich inspiriert hat.", tip: "Z.B. durch Haltung, Aktion etc." },
      { challenge: "Frag jemanden nach seiner Meinung.", tip: "Z.B. zu einem aktuellen Thema oder Outfit." },
      { challenge: "Sag einer Person, was du an ihr magst.", tip: "Augenkontakt nicht vergessen." },
      { challenge: "Rede mit jemandem, den du attraktiv findest.", tip: "Konzentrier dich auf Verbindung, nicht Ergebnis." }
    ],
    // Wochen 5–12 entsprechend erweitern …
  ];

  const challengeToday = allChallenges[currentWeek - 1]?.[currentChallengeIndex];

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-md mx-auto p-4 pt-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">MIA Coach</h1>
          <p className="text-sm text-muted-foreground">Heute bist du wieder 1% mutiger ✨</p>
        </div>

        <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <img 
                src="/lovable-uploads/e819d6a5-7715-4cb0-8f30-952438637b87.png" 
                alt="MIA Avatar" 
                className="w-12 h-12 rounded-full object-cover"
              />
            </div>
            <CardTitle className="text-lg text-foreground">
              {challengeToday ? `Challenge Woche ${currentWeek}` : "Keine Challenge gefunden"}
            </CardTitle>
            <CardDescription>
              {challengeToday ? `Tag ${currentChallengeIndex + 1}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-muted">
              <p className="text-center font-medium text-foreground leading-relaxed">
                {challengeToday?.challenge || "..."}
              </p>
            </div>
            <div className="text-center text-sm text-muted-foreground italic">
              Tipp: {challengeToday?.tip || "..."}
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {challengeToday ? "Mut beginnt mit dem ersten Schritt 🚀" : ""}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ChallengePage;
