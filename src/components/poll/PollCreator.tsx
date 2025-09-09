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
        className="sm:max-w-lg border-0 bg-transparent p-0 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--poll-gradient-start) / 0.15), hsl(var(--poll-gradient-end) / 0.15))',
          backdropFilter: 'blur(20px)',
          border: '1px solid hsl(var(--poll-border))',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px hsl(var(--poll-shadow)), 0 0 0 1px hsl(var(--poll-border))'
        }}
      >
        {/* Elegant header with gradient */}
        <div 
          className=" text-white p-6 pb-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--poll-gradient-start) / 0.3), hsl(var(--poll-gradient-end) / 0.2))'
          }}
        >
          <div className="absolute inset-0 animate-poll-shimmer opacity-50"></div>
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-xl font-semibold flex items-center gap-3 text-white">
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm animate-poll-glow">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              Elegante Umfrage erstellen
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <div 
          className="p-6 pt-4 space-y-6"
          style={{
            background: 'hsl(var(--poll-glass-bg))',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Question input with elegant styling */}
          <div className="space-y-3">
            <Label 
              htmlFor="question" 
              className="text-sm font-medium text-white/90 flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-white/70" />
              Deine Frage
            </Label>
            <div className="relative">
              <Input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Was möchtest du die Community fragen?"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-2 focus:ring-white/20 rounded-xl h-12 px-4 transition-all duration-300"
                style={{
                  backdropFilter: 'blur(10px)'
                }}
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          </div>

          {/* Options with elegant styling */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-white/90 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-white/70" />
              Antwortmöglichkeiten
            </Label>
            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-3 group">
                  <div className="flex-1 relative">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-2 focus:ring-white/20 rounded-xl h-11 px-4 pr-12 transition-all duration-300"
                      style={{
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </div>
                  </div>
                  {options.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      className="h-10 w-10 text-white/50 hover:text-white hover:bg-red-500/20 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
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
                variant="ghost"
                onClick={handleAddOption}
                className="w-full h-11 mt-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/20 hover:border-white/30 rounded-xl transition-all duration-300 group"
                style={{
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                Weitere Option hinzufügen
              </Button>
            )}
          </div>

          {/* Action buttons with elegant styling */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="px-6 py-2.5 text-white/70 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-xl transition-all duration-300"
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="px-8 py-2.5 bg-gradient-to-r from-hsl(var(--poll-gradient-start)) to-hsl(var(--poll-gradient-end)) hover:from-hsl(var(--poll-gradient-start) / 0.9) hover:to-hsl(var(--poll-gradient-end) / 0.9) text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                boxShadow: canSubmit ? '0 8px 32px hsl(var(--poll-shadow))' : 'none'
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Umfrage erstellen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PollCreator;