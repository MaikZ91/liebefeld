
import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';

interface FormHeaderProps {
  onCancel?: () => void;
}

const FormHeader: React.FC<FormHeaderProps> = ({ onCancel }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-semibold">Event erstellen</h2>
      {onCancel && (
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={onCancel}
          className="rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default FormHeader;
