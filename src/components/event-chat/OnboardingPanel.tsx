
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, UserPlus, MessageCircle, Heart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  image: string;
  buttonText: string;
  buttonAction: () => void;
}

interface OnboardingPanelProps {
  onComplete: () => void;
  onCreateProfile: () => void;
  onOpenCommunity: () => void;
  className?: string;
}

const OnboardingPanel: React.FC<OnboardingPanelProps> = ({
  onComplete,
  onCreateProfile,
  onOpenCommunity,
  className
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Willkommen bei ThE Tribe! 🎉",
      description: "Schön, dass du da bist! Entdecke Events, chatte mit der Community und finde deine perfekten Erlebnisse in Bielefeld.",
      image: "/lovable-uploads/2653c557-0afe-4690-9d23-0b523cb09e3e.png",
      buttonText: "Los geht's!",
      buttonAction: () => handleNext()
    },
    {
      id: 2,
      title: "Erstelle dein Profil",
      description: "Melde dich an und erstelle dein Benutzerprofil, um personalisierte Event-Empfehlungen und maßgeschneiderte Chat-Antworten zu erhalten.",
      image: "/lovable-uploads/4a08308d-0a6d-4114-b820-f511ce7d7a65.png",
      buttonText: "Profil erstellen",
      buttonAction: onCreateProfile
    },
    {
      id: 3,
      title: "Community Chat",
      description: "Tritt dem Community Chat bei! Tausche dich mit anderen Event-Liebhabern aus, teile Tipps und entdecke Geheimtipps.",
      image: "/lovable-uploads/764c9b33-5d7d-4134-b503-c77e23c469f9.png",
      buttonText: "Chat beitreten",
      buttonAction: onOpenCommunity
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className={cn(
      "relative bg-gradient-to-br from-red-900/20 to-black rounded-xl overflow-hidden shadow-2xl max-w-md mx-auto border border-red-500/30 mb-4",
      className
    )}>
      {/* Close/Skip Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8"
        onClick={handleSkip}
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Step Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={currentStepData.image}
          alt={currentStepData.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Navigation Arrows */}
        {steps.length > 1 && (
          <>
            {currentStep > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            
            {currentStep < steps.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
        
        {/* Step Indicators */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentStep ? "bg-red-500" : "bg-white/40"
              )}
            />
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Step Counter */}
        <div className="text-xs text-red-400 font-medium">
          Schritt {currentStep + 1} von {steps.length}
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-white">
          {currentStepData.title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-300 text-sm leading-relaxed">
          {currentStepData.description}
        </p>
        
        {/* Action Button */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={currentStepData.buttonAction}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium"
          >
            {currentStep === 1 && <UserPlus className="h-4 w-4 mr-2" />}
            {currentStep === 2 && <MessageCircle className="h-4 w-4 mr-2" />}
            {currentStep === 0 && <Heart className="h-4 w-4 mr-2" />}
            {currentStepData.buttonText}
          </Button>
          
          {currentStep === steps.length - 1 && (
            <Button
              variant="outline"
              onClick={handleSkip}
              className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Fertig
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPanel;
