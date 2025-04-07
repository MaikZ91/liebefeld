
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
    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-red-200 dark:border-red-800/30">
      {onCancel && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="rounded-full border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
        >
          Abbrechen
        </Button>
      )}
      <Button 
        type="submit" 
        className="rounded-full bg-red-600 hover:bg-red-700 text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Wird erstellt..." : isPaid ? "Weiter zur Zahlung" : "Event erstellen"}
      </Button>
    </div>
  );
};

export default FormFooter;
