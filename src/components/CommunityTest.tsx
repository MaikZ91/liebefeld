import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

type Question = {
  id: number;
  text: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
};

const questions: Question[] = [
  {
    id: 1,
    text: "Was würdest du am liebsten in der Liebefeld Community tun?",
    options: [
      { id: "a", text: "Hauptsächlich Beiträge lesen und über Events informiert werden" },
      { id: "b", text: "Aktiv an Treffen teilnehmen und selbst Ideen für gemeinsame Aktivitäten einbringen" },
      { id: "c", text: "Nur bei sehr interessanten Themen mitmachen" },
      { id: "d", text: "Hauptsächlich online diskutieren, aber selten persönlich erscheinen" }
    ],
    correctAnswer: "b"
  },
  {
    id: 2,
    text: "Wie würdest du zur Vielfalt unserer Community beitragen?",
    options: [
      { id: "a", text: "Ich habe wenig Zeit und möchte hauptsächlich informiert bleiben" },
      { id: "b", text: "Durch Teilen von lokalen Geheimtipps und interessanten Orten in der Umgebung" },
      { id: "c", text: "Indem ich meine speziellen Fähigkeiten oder Hobbys mit anderen teile" },
      { id: "d", text: "Durch Vernetzung mit anderen Mitgliedern mit ähnlichen Interessen" }
    ],
    correctAnswer: "c"
  },
  {
    id: 3,
    text: "Was erhoffst du dir von deiner Teilnahme in der Community?",
    options: [
      { id: "a", text: "Neue Freundschaften knüpfen und gemeinsame Aktivitäten unternehmen" },
      { id: "b", text: "Hauptsächlich Informationen über lokale Ereignisse erhalten" },
      { id: "c", text: "Berufliche Kontakte knüpfen" },
      { id: "d", text: "Angebote und Rabatte von lokalen Geschäften bekommen" }
    ],
    correctAnswer: "a"
  }
];

interface CommunityTestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappUrl: string;
}

const CommunityTest = ({ open, onOpenChange, whatsappUrl }: CommunityTestProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [freeText, setFreeText] = useState("");
  const { toast } = useToast();
  
  const totalSteps = questions.length + 1; // Questions + free text
  const minCharacters = 50; // Changed from 20 to 50 characters required for free text
  const characterCount = freeText.length;
  const needsMoreCharacters = characterCount < minCharacters;
  
  const handleAnswer = (questionId: number, answerId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };
  
  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    
    if (currentStep < questions.length) {
      if (!answers[currentQuestion.id]) {
        toast({
          title: "Bitte wähle eine Antwort",
          description: "Du musst eine Option auswählen, um fortzufahren.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
    }
    
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      checkAnswers();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const checkAnswers = () => {
    if (freeText.trim().length < minCharacters) {
      toast({
        title: "Deine Antwort ist zu kurz",
        description: "Bitte teile uns etwas mehr über dich mit. Was sind deine Hobbys und Interessen?",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    const correctAnswersCount = questions.reduce((count, question) => {
      return answers[question.id] === question.correctAnswer ? count + 1 : count;
    }, 0);
    
    const passThreshold = 2; // At least 2 questions must be answered correctly
    
    if (correctAnswersCount >= passThreshold) {
      toast({
        title: "Du passt perfekt zu uns!",
        description: "Wir freuen uns, dich in unserer Community begrüßen zu dürfen. Du wirst gleich zur WhatsApp Gruppe weitergeleitet.",
        variant: "success",
        duration: 5000,
      });
      
      // Redirect to WhatsApp after a short delay
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
        onOpenChange(false);
      }, 1500);
    } else {
      toast({
        title: "Wir suchen aktive Mitglieder",
        description: "Es scheint, als ob du vielleicht nicht nach einer aktiven Teilnahme in unserer Community suchst. Wir möchten vor allem Menschen verbinden, die sich aktiv einbringen möchten.",
        variant: "destructive",
        duration: 5000,
      });
      
      // Reset test
      setCurrentStep(0);
      setAnswers({});
      setFreeText("");
    }
  };
  
  const renderQuestion = (question: Question) => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{question.text}</h3>
        <RadioGroup 
          value={answers[question.id]} 
          onValueChange={(value) => handleAnswer(question.id, value)}
        >
          {question.options.map(option => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={`q${question.id}-${option.id}`} />
              <Label htmlFor={`q${question.id}-${option.id}`}>{option.text}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };
  
  const renderFreeTextStep = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Erzähl uns etwas über dich!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Was sind deine Hobbys und Interessen? Hast du besondere Fähigkeiten oder Talente, die du gerne mit anderen teilen würdest? Was macht dich als Person interessant?
        </p>
        <div className="space-y-2">
          <Textarea 
            placeholder="Ich bin... / Meine Interessen sind... / In meiner Freizeit..." 
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            className={`min-h-[150px] ${needsMoreCharacters ? 'border-orange-300 focus-visible:ring-orange-300' : 'border-green-500 focus-visible:ring-green-500'}`}
          />
          <div className="flex justify-between text-sm">
            <span className={`${needsMoreCharacters ? 'text-orange-500' : 'text-green-600'}`}>
              {characterCount} / {minCharacters} Zeichen
            </span>
            {needsMoreCharacters && (
              <span className="text-orange-500">
                Noch {minCharacters - characterCount} Zeichen benötigt
              </span>
            )}
            {!needsMoreCharacters && (
              <span className="text-green-600">
                ✓ Ausreichend Zeichen
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Werde Teil unserer Community</DialogTitle>
          <DialogDescription>
            Hey! Schön, dass du Interesse an unserer Liebefeld-Community hast! Damit wir eine aktive und vielfältige Gruppe bleiben, 
            möchten wir dich etwas besser kennenlernen. Erzähl uns ein bisschen über dich und deine Erwartungen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4 flex justify-between text-sm text-gray-500">
            <span>Schritt {currentStep + 1} von {totalSteps}</span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% geschafft</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700 mb-6">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            ></div>
          </div>
          
          {currentStep < questions.length 
            ? renderQuestion(questions[currentStep]) 
            : renderFreeTextStep()
          }
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Zurück
          </Button>
          <Button 
            onClick={handleNext}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {currentStep === totalSteps - 1 ? "Beitritt bestätigen" : "Weiter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityTest;
