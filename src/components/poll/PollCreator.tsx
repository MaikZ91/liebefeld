import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PollCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreatePoll: (poll: {
    question: string;
    options: string[];
  }) => void;
}

const PollCreator: React.FC<PollCreatorProps> = ({
  open,
  onOpenChange,
  onCreatePoll
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    if (question.trim() && options.filter(opt => opt.trim()).length >= 2) {
      onCreatePoll({
        question: question.trim(),
        options: options.filter(opt => opt.trim())
      });
      
      // Reset form
      setQuestion('');
      setOptions(['', '']);
      onOpenChange(false);
    }
  };

  const canSubmit = question.trim() && options.filter(opt => opt.trim()).length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Umfrage erstellen</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="question">Frage</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Was möchtest du fragen?"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Antwortmöglichkeiten</Label>
            <div className="space-y-2 mt-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 10 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="mt-2 w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Option hinzufügen
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Umfrage erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PollCreator;