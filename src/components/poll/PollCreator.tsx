import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Sparkles, BarChart3 } from 'lucide-react';
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
      <DialogContent 
        className="sm:max-w-md border-0 bg-transparent p-0 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--poll-gradient-start) / 0.15), hsl(var(--poll-gradient-end) / 0.15))',
          backdropFilter: 'blur(20px)',
          border: '1px solid hsl(var(--poll-border))',
          borderRadius: '16px',
          boxShadow: '0 8px 24px hsl(var(--poll-shadow))'
        }}
      >
        {/* Header */}
        <div 
          className="text-white p-4 pb-3"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--poll-gradient-start) / 0.2), hsl(var(--poll-gradient-end) / 0.2))'
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-white">
              <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              Umfrage erstellen
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <div 
          className="p-4 pt-3 space-y-4"
          style={{
            background: 'hsl(var(--poll-glass-bg))',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Question input */}
          <div className="space-y-2">
            <Label 
              htmlFor="question" 
              className="text-sm font-medium text-white/90 flex items-center gap-1.5"
            >
              <Sparkles className="h-3 w-3 text-white/70" />
              Frage
            </Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Was möchtest du fragen?"
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 rounded-lg h-9 px-3"
              style={{
                backdropFilter: 'blur(10px)'
              }}
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-white/90">
              Antwortmöglichkeiten
            </Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 rounded-lg h-8 px-3 pr-8 text-sm"
                      style={{
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 text-xs font-medium">
                      {String.fromCharCode(65 + index)}
                    </div>
                  </div>
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      className="h-8 w-8 text-white/50 hover:text-white hover:bg-red-500/20 rounded-lg"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {options.length < 10 && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleAddOption}
                className="w-full h-8 mt-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/20 hover:border-white/30 rounded-lg text-sm"
              >
                <Plus className="h-3 w-3 mr-1" />
                Option hinzufügen
              </Button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="px-4 py-1.5 text-white/70 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg text-sm"
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-6 py-1.5 bg-gradient-to-r from-hsl(var(--poll-gradient-start)) to-hsl(var(--poll-gradient-end)) text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PollCreator;