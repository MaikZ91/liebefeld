
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitPayment: () => void;
  contactEmail: string;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  onSubmitPayment,
  contactEmail
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Zahlung für kostenpflichtiges Event</DialogTitle>
          <DialogDescription>
            Für kostenpflichtige Events berechnen wir eine Gebühr von 10€.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-4 rounded-lg">
            <h3 className="font-medium text-red-700 dark:text-red-300 mb-2 flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Email Anfrage
            </h3>
            <p className="text-sm mb-3">
              Bitte kontaktiere uns per Email, um dein kostenpflichtiges Event zu bewerben:
            </p>
            <div className="bg-white dark:bg-slate-800 p-3 rounded border border-red-200 dark:border-red-800/30 text-center">
              <a href="mailto:info@liebefeld.de" className="text-red-600 dark:text-red-400 hover:text-red-700 font-medium">
                info@liebefeld.de
              </a>
            </div>
            {contactEmail && (
              <p className="text-sm mt-2">
                Wir werden auch deine angegebene Email-Adresse ({contactEmail}) für Rückfragen verwenden.
              </p>
            )}
          </div>
          
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span>Kostenpflichtiges Event</span>
              <span>10,00 €</span>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button type="button" onClick={onSubmitPayment}>
            Event erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
