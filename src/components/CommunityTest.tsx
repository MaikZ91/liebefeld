
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
    text: "Was ist das Hauptziel der Liebefeld Community?",
    options: [
      { id: "a", text: "Geld zu verdienen" },
      { id: "b", text: "Lokale Events und Menschen zu verbinden" },
      { id: "c", text: "Online zu spielen" },
      { id: "d", text: "Werbung zu machen" }
    ],
    correctAnswer: "b"
  },
  {
    id: 2,
    text: "Welche Art von Inhalten sind in der Community erwünscht?",
    options: [
      { id: "a", text: "Nur politische Diskussionen" },
      { id: "b", text: "Nur Werbung für eigene Produkte" },
      { id: "c", text: "Lokale Events, respektvolle Diskussionen und gemeinschaftsfördernde Inhalte" },
      { id: "d", text: "Kontroverse und polarisierende Themen" }
    ],
    correctAnswer: "c"
  },
  {
    id: 3,
    text: "Wie sollten Mitglieder miteinander umgehen?",
    options: [
      { id: "a", text: "Mit Respekt und Freundlichkeit" },
      { id: "b", text: "Möglichst kritisch und konfrontativ" },
      { id: "c", text: "Ignorieren anderer Meinungen" },
      { id: "d", text: "Nur kommunizieren wenn nötig" }
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
  
  const handleAnswer = (questionId: number, answerId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };
  
  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    
    if (currentStep < questions.length) {
      if (!answers[currentQuestion.id]) {
        toast({
          title: "Bitte wählen Sie eine Antwort",
          description: "Sie müssen eine Option auswählen, um fortzufahren.",
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
    if (freeText.trim().length < 10) {
      toast({
        title: "Antwort zu kurz",
        description: "Bitte schreiben Sie mindestens ein paar Sätze im Freitext-Feld.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    const correctAnswersCount = questions.reduce((count, question) => {
      return answers[question.id] === question.correctAnswer ? count + 1 : count;
    }, 0);
    
    const passThreshold = questions.length; // All questions must be answered correctly
    
    if (correctAnswersCount >= passThreshold) {
      toast({
        title: "Herzlichen Glückwunsch!",
        description: "Sie haben den Test bestanden. Sie werden zur WhatsApp Community weitergeleitet.",
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
        title: "Test nicht bestanden",
        description: `Sie haben ${correctAnswersCount} von ${questions.length} Fragen richtig beantwortet. Bitte versuchen Sie es erneut.`,
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
        <h3 className="text-lg font-medium">Warum möchten Sie der Liebefeld Community beitreten?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Bitte teilen Sie uns mit, warum Sie an der Community interessiert sind und was Sie beitragen möchten.
        </p>
        <Textarea 
          placeholder="Schreiben Sie Ihre Antwort hier..." 
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          className="min-h-[120px]"
        />
      </div>
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Community-Beitrittstest</DialogTitle>
          <DialogDescription>
            Bevor Sie der WhatsApp Community beitreten können, bitten wir Sie, diesen kurzen Test zu absolvieren.
            Dies hilft uns, eine respektvolle und konstruktive Gemeinschaft zu fördern.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4 flex justify-between text-sm text-gray-500">
            <span>Schritt {currentStep + 1} von {totalSteps}</span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% abgeschlossen</span>
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
            {currentStep === totalSteps - 1 ? "Fertigstellen" : "Weiter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityTest;
