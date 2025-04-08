
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    text: "Bist du neu in Liebefeld?",
    options: [
      { id: "a", text: "Ja, ich bin neu hier und möchte Leute kennenlernen" },
      { id: "b", text: "Nein, ich lebe schon länger hier" }
    ],
    correctAnswer: "a"
  },
  {
    id: 2,
    text: "Wofür interessierst du dich am meisten?",
    options: [
      { id: "a", text: "Ausgehen, Events und Kulturveranstaltungen" },
      { id: "b", text: "Sport und Outdoor-Aktivitäten" },
      { id: "c", text: "Kreative Projekte und künstlerische Aktivitäten" }
    ],
    correctAnswer: "a"
  },
  {
    id: 3,
    text: "Wie möchtest du dich in der Community einbringen?",
    options: [
      { id: "a", text: "Ich würde gerne aktiv teilnehmen und Ideen einbringen" },
      { id: "b", text: "Ich schaue erstmal und lese lieber mit" }
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
  const { toast } = useToast();
  
  const totalSteps = questions.length;
  
  const handleAnswer = (questionId: number, answerId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };
  
  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    
    if (!answers[currentQuestion.id]) {
      toast({
        title: "Bitte wähle eine Antwort",
        description: "Du musst eine Option auswählen, um fortzufahren.",
        variant: "destructive",
        duration: 3000,
      });
      return;
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
    // Check if the user is interested in active participation
    const isActive = answers[3] === "a";
    
    // Accept users who are new to the area or interested in events/activities
    const isNewToArea = answers[1] === "a";
    const hasInterests = answers[2] && ["a", "b", "c"].includes(answers[2]);
    
    if (isActive && (isNewToArea || hasInterests)) {
      toast({
        title: "Du passt perfekt zu uns!",
        description: "Wir freuen uns, dich in unserer Community begrüßen zu dürfen. Du wirst gleich zur WhatsApp Gruppe weitergeleitet.",
        variant: "success",
        duration: 3000,
      });
      
      // Redirect to WhatsApp after a short delay
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
        onOpenChange(false);
      }, 2000);
    } else {
      toast({
        title: "Wir suchen aktive Mitglieder",
        description: "Es scheint, als ob du vielleicht nicht nach einer aktiven Teilnahme in unserer Community suchst. Wir möchten vor allem Menschen verbinden, die sich aktiv beteiligen möchten.",
        variant: "destructive",
        duration: 4000,
      });
      
      // Close the dialog after showing the toast
      setTimeout(() => {
        onOpenChange(false);
      }, 4000);
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Werde Teil unserer Community</DialogTitle>
          <DialogDescription>
            Hey! Schön, dass du Interesse an unserer Liebefeld-Community hast! Beantworte bitte kurz diese Fragen, damit wir dich besser kennenlernen können.
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
          
          {renderQuestion(questions[currentStep])}
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
