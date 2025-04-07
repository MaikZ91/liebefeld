
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard } from 'lucide-react';
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
  paymentMethod: 'credit_card' | 'paypal';
  setPaymentMethod: (method: 'credit_card' | 'paypal') => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  onSubmitPayment,
  paymentMethod,
  setPaymentMethod
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
          <div className="grid gap-2">
            <Label>Zahlungsmethode</Label>
            <RadioGroup 
              value={paymentMethod} 
              onValueChange={(value) => setPaymentMethod(value as 'credit_card' | 'paypal')}
              className="grid gap-2"
            >
              <div className="flex items-center space-x-2 p-2 rounded-lg border border-input hover:bg-muted">
                <RadioGroupItem value="credit_card" id="credit_card" />
                <Label htmlFor="credit_card" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Kreditkarte
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg border border-input hover:bg-muted">
                <RadioGroupItem value="paypal" id="paypal_payment" />
                <Label htmlFor="paypal_payment" className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.5 12.5h2.25c1.375 0 2.625-.875 3.125-2.125.5-1.25.125-2.125-1.25-2.125h-1.5c-.125 0-.25.125-.25.25l-1.25 6.5c0 .125.125.25.25.25h1-.125c.125 0 .375-.125.375-.25l.25-1.375c0-.125-.125-.25-.25-.25l-.125.25c0-.25.125-.375.25-.375h-2.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M12 10.375c0 1.25.625 2.125 2 2.125h2.25c.125 0 .25-.125.25-.25L17 9c0-.125-.125-.25-.25-.25h-2c-1.5 0-2.75 1-2.75 1.625zM14.5 12.5l-.5 2.625c0 .125.125.25.25.25h1-.125c.125 0 .25-.125.25-.25l.375-2.375" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M18.5 9.5c.625-.625 1-1.5 1-2.5a3.5 3.5 0 00-3.5-3.5h-8.75c-.125 0-.25.125-.25.25l-2.5 13.25c0 .125.125.25.25.25h2.75l.75-3.75m11.25-4 .5-2.625c0-.125-.125-.25-.25-.25h-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  PayPal
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {paymentMethod === 'credit_card' && (
            <div className="grid gap-2">
              <Label htmlFor="cardNumber">Kartennummer</Label>
              <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="expiry">Ablaufdatum</Label>
                  <Input id="expiry" placeholder="MM/YY" />
                </div>
                <div>
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" placeholder="123" />
                </div>
              </div>
              
              <Label htmlFor="cardName">Karteninhaber</Label>
              <Input id="cardName" placeholder="Name des Karteninhabers" />
            </div>
          )}
          
          {paymentMethod === 'paypal' && (
            <div className="flex flex-col items-center justify-center p-4 text-center gap-2">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.5 12.5h2.25c1.375 0 2.625-.875 3.125-2.125.5-1.25.125-2.125-1.25-2.125h-1.5c-.125 0-.25.125-.25.25l-1.25 6.5c0 .125.125.25.25.25h1-.125c.125 0 .375-.125.375-.25l.25-1.375c0-.125-.125-.25-.25-.25l-.125.25c0-.25.125-.375.25-.375h-2.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M12 10.375c0 1.25.625 2.125 2 2.125h2.25c.125 0 .25-.125.25-.25L17 9c0-.125-.125-.25-.25-.25h-2c-1.5 0-2.75 1-2.75 1.625zM14.5 12.5l-.5 2.625c0 .125.125.25.25.25h1-.125c.125 0 .25-.125.25-.25l.375-2.375" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                <path d="M18.5 9.5c.625-.625 1-1.5 1-2.5a3.5 3.5 0 00-3.5-3.5h-8.75c-.125 0-.25.125-.25.25l-2.5 13.25c0 .125.125.25.25.25h2.75l.75-3.75m11.25-4 .5-2.625c0-.125-.125-.25-.25-.25h-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <p>Sie werden zur PayPal-Website weitergeleitet, um die Zahlung abzuschließen.</p>
            </div>
          )}
          
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
            10,00 € Bezahlen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
