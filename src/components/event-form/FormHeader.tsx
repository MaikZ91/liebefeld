
import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface FormHeaderProps {
  onCancel?: () => void;
}

const FormHeader: React.FC<FormHeaderProps> = ({ onCancel }) => {
  return (
    <div className="flex justify-between items-center mb-6 border-b border-red-200 dark:border-red-800/30 pb-4">
      <h2 className="text-3xl font-semibold text-red-700 dark:text-red-300">Event erstellen</h2>
      {onCancel && (
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-100"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default FormHeader;
