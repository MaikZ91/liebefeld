
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

type CheckboxQuestion = {
  id: number;
  options: { id: string; text: string }[];
};

const questions: CheckboxQuestion[] = [
  {
    id: 1,
    options: [
      { id: "a", text: "Ja, ich bin neu in Bielefeld und möchte Leute kennenlernen" }
    ]
  },
  {
    id: 2,
    options: [
      { id: "a", text: "Ausgehen, Sport und kreative Aktivitäten interessieren mich" }
    ]
  },
  {
    id: 3,
    options: [
      { id: "a", text: "Ich habe Bock mich mit anderen Menschen zu verbinden mit gleichen Interessen" }
    ]
  }
];

interface CommunityTestProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappUrl: string;
}

const CommunityTest = ({ open, onOpenChange, whatsappUrl }: CommunityTestProps) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const handleCheckboxChange = (questionId: number, optionId: string, checked: boolean) => {
    setSelectedOptions(prev => ({
      ...prev,
      [`${questionId}-${optionId}`]: checked
    }));
  };
  
  const handleSubmit = () => {
    // Check if at least one checkbox is selected
    const atLeastOneSelected = Object.values(selectedOptions).some(isSelected => isSelected);
    
    if (!atLeastOneSelected) {
      toast({
        title: "Bitte wähle mindestens eine Option",
        description: "Du musst mindestens eine Option auswählen, um fortzufahren.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Test passed if at least one checkbox is selected
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
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Werde Teil unserer Community</DialogTitle>
          <DialogDescription>
            Hey! Schön, dass du Interesse an unserer Bielefeld-Community hast! Wähle mindestens eine der folgenden Optionen aus, um teilzunehmen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {questions.map((question) => (
            <div key={question.id} className="space-y-3">
              {question.options.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`q${question.id}-${option.id}`} 
                    checked={selectedOptions[`${question.id}-${option.id}`] || false}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange(question.id, option.id, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`q${question.id}-${option.id}`}
                    className="text-sm"
                  >
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleSubmit}
            className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto"
          >
            Beitritt bestätigen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityTest;
