
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
      { id: "a", text: "Ja, ich bin neu in Liebefeld und möchte Leute kennenlernen" }
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
          <DialogTitle>Werde Teil von Tribe Liebefeld</DialogTitle>
          <DialogDescription>
            Hey! Schön, dass du Interesse an unserer Liebefeld-Community hast! Wähle mindestens eine der folgenden Optionen aus, um teilzunehmen.
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
            className="bg-[#25D366] hover:bg-[#128C7E] w-full sm:w-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" className="h-5 w-5 mr-2">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp Community beitreten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommunityTest;
