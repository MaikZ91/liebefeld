import React from 'react';
import { Calendar, Share2, Download, MessageCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Event } from '@/types/eventTypes';
import { toast } from 'sonner';

interface ExportShareMenuProps {
  events: Event[];
}

export const ExportShareMenu: React.FC<ExportShareMenuProps> = ({ events }) => {
  const generateICalFile = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tribe Liebefeld//Events//DE',
      'CALSCALE:GREGORIAN',
      ...events.flatMap(event => [
        'BEGIN:VEVENT',
        `DTSTART:${event.date.replace(/-/g, '')}`,
        `SUMMARY:${event.title}`,
        `LOCATION:${event.location || ''}`,
        `DESCRIPTION:${event.description || ''}`,
        `URL:${event.link || ''}`,
        `UID:${event.id}@tribe-liebefeld.de`,
        'END:VEVENT'
      ]),
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tribe-events.ics';
    link.click();
    toast.success('Kalender-Datei heruntergeladen');
  };

  const shareViaWhatsApp = () => {
    const eventList = events
      .map(e => `📅 ${e.title}\n📍 ${e.location || 'TBA'}\n🗓️ ${e.date}`)
      .join('\n\n');
    const text = `Schau dir diese Events an! 🎉\n\n${eventList}\n\nMehr auf: ${window.location.origin}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const copyToClipboard = () => {
    const eventList = events
      .map(e => `${e.title} - ${e.date} - ${e.location || 'TBA'}`)
      .join('\n');
    navigator.clipboard.writeText(eventList);
    toast.success('In Zwischenablage kopiert');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-white/20">
          <Share2 className="h-4 w-4 mr-2" />
          Teilen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-black/90 border-white/20">
        <DropdownMenuItem onClick={generateICalFile} className="cursor-pointer">
          <Calendar className="h-4 w-4 mr-2" />
          iCal exportieren
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareViaWhatsApp} className="cursor-pointer">
          <MessageCircle className="h-4 w-4 mr-2" />
          Via WhatsApp teilen
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          <Download className="h-4 w-4 mr-2" />
          Kopieren
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
