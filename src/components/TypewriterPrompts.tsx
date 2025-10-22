import React, { useState, useEffect } from 'react';

const prompts = [
  "Welche Konzerte finden heute statt?",
  "Was kann ich am Wochenende machen?",
  "Gibt es Events für Kinder?",
  "Zeige mir Sportveranstaltungen",
  "Welche Partys steigen heute Abend?",
  "Gibt es kreative Workshops?",
  "Was läuft im Theater?",
  "Welche Festivals sind geplant?",
  "Zeige mir kostenlose Events",
  "Gibt es Kunstausstellungen?",
  "Welche Comedy-Shows laufen?",
  "Was kann ich mit Freunden unternehmen?",
  "Gibt es Outdoor-Events?",
  "Zeige mir kulinarische Events",
  "Welche Networking-Events gibt es?",
];

interface TypewriterPromptsProps {
  className?: string;
}

const TypewriterPrompts: React.FC<TypewriterPromptsProps> = ({ className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPrompt = prompts[currentIndex];
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing phase
        if (displayText.length < currentPrompt.length) {
          setDisplayText(currentPrompt.slice(0, displayText.length + 1));
        } else {
          // Wait 2 seconds before deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting phase
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          // Move to next prompt
          setIsDeleting(false);
          setCurrentIndex((prev) => (prev + 1) % prompts.length);
        }
      }
    }, isDeleting ? 30 : 80); // Faster deleting, smooth typing

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentIndex]);

  return (
    <span className={`${className}`}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default TypewriterPrompts;
