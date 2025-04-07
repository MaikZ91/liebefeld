
import React from 'react';
import { Button } from "@/components/ui/button";

interface FormFooterProps {
  onCancel?: () => void;
  isSubmitting: boolean;
  isPaid: boolean;
}

const FormFooter: React.FC<FormFooterProps> = ({ 
  onCancel, 
  isSubmitting, 
  isPaid 
}) => {
  return (
    <div className="flex justify-end gap-2 mt-4">
      {onCancel && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="rounded-full"
        >
          Abbrechen
        </Button>
      )}
      <Button 
        type="submit" 
        className="rounded-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Wird erstellt..." : isPaid ? "Weiter zur Zahlung" : "Event erstellen"}
      </Button>
    </div>
  );
};

export default FormFooter;
