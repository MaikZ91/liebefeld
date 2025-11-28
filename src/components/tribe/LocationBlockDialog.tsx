import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface LocationBlockDialogProps {
  open: boolean;
  location: string;
  onBlock: () => void;
  onCancel: () => void;
}

export const LocationBlockDialog: React.FC<LocationBlockDialogProps> = ({
  open,
  location,
  onBlock,
  onCancel,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent className="bg-black border border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white font-extrabold tracking-[0.25em]">
            LOCATION BLOCKIEREN?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400 text-sm">
            Du hast Events von <span className="text-gold font-bold">{location}</span> bereits 3 mal verworfen. 
            Möchtest du keine Events mehr von dieser Location sehen?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            className="bg-zinc-900 text-white border-white/10 hover:bg-zinc-800"
          >
            Weiter anzeigen
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onBlock}
            className="bg-gold text-black hover:bg-gold/90 font-bold"
          >
            Location blockieren
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
