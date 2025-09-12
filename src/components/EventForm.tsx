
import React, { useState } from "react";
import { useEventContext } from "@/contexts/EventContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { USERNAME_KEY, AVATAR_KEY } from "@/types/chatTypes";
import { createCitySpecificGroupId } from "@/utils/groupIdUtils";

interface EventFormProps {
  onSuccess?: () => void;
  selectedDate?: Date;
  onAddEvent?: (event: any) => Promise<void>;
  onCancel?: () => void;
  createRsvpPoll?: boolean; // Add this prop to indicate when to create RSVP poll
}

const EventForm: React.FC<EventFormProps> = ({ 
  onSuccess, 
  selectedDate,
  onAddEvent,
  onCancel,
  createRsvpPoll = false
}) => {
  const { addUserEvent, selectedCity } = useEventContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: format(selectedDate || new Date(), "yyyy-MM-dd"),
    time: "18:00",
    location: "",
    organizer: "",
    category: "Sonstiges",
    link: "",
  });

  const categories = [
    "Konzert",
    "Party",
    "Ausstellung",
    "Workshop",
    "Sport",
    "Theater",
    "Film",
    "Sonstiges",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let createdEvent;
      
      // If onAddEvent was provided, use it, otherwise use addUserEvent from context
      if (onAddEvent) {
        createdEvent = await onAddEvent({
          ...formData,
          date: formData.date,
          time: formData.time,
        });
      } else {
        // Add event to context (which will save to database)
        createdEvent = await addUserEvent({
          ...formData,
          date: formData.date,
          time: formData.time,
        });
      }

      // Create RSVP poll in community chat if requested
      if (createRsvpPoll && createdEvent) {
        try {
          const storedUsername = localStorage.getItem(USERNAME_KEY) || 'Anonymous';
          const avatar = localStorage.getItem(AVATAR_KEY) || null;
          const communityGroupId = createCitySpecificGroupId('ausgehen', selectedCity);
          
          // Format the event text
          const eventText = `🎉 **${formData.title}**\n📅 ${formData.date} um ${formData.time}${formData.location ? `\n📍 ${formData.location}` : ''}${formData.description ? `\n\n${formData.description}` : ''}`;
          
          // Create RSVP poll message
          const pollMessage = {
            group_id: communityGroupId,
            sender: storedUsername,
            avatar: avatar,
            text: eventText,
            poll_question: `Wer nimmt teil an "${formData.title}"?`,
            poll_options: JSON.stringify(['Nehme teil', 'Nein', 'Vielleicht']),
            poll_votes: null,
            poll_allow_multiple: false,
            event_id: createdEvent.id || null,
            event_title: formData.title,
            event_date: formData.date,
            event_location: formData.location || null
          };

          const { error: pollError } = await supabase
            .from('chat_messages')
            .insert([pollMessage]);

          if (pollError) {
            console.error('Error creating RSVP poll:', pollError);
            toast.error("Event erstellt, aber RSVP-Umfrage konnte nicht erstellt werden", {
              description: "Das Event wurde gespeichert, die Umfrage im Chat konnte aber nicht erstellt werden.",
            });
          } else {
            console.log('RSVP poll created successfully');
          }
        } catch (pollError) {
          console.error('Error creating RSVP poll:', pollError);
          toast.error("Event erstellt, aber RSVP-Umfrage konnte nicht erstellt werden", {
            description: "Das Event wurde gespeichert, die Umfrage im Chat konnte aber nicht erstellt werden.",
          });
        }
      }

      toast.success("Event erfolgreich erstellt!", {
        description: `${formData.title} wurde zum Kalender hinzugefügt${createRsvpPoll ? ' und RSVP-Umfrage im Chat erstellt' : ''}.`,
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        date: format(selectedDate || new Date(), "yyyy-MM-dd"),
        time: "18:00",
        location: "",
        organizer: "",
        category: "Sonstiges",
        link: "",
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Fehler beim Erstellen des Events", {
        description: "Bitte versuche es später noch einmal.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titel *</Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Eventname"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Beschreibe das Event"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Datum *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Uhrzeit *</Label>
          <Input
            id="time"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Ort</Label>
        <Input
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Veranstaltungsort"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="organizer">Veranstalter</Label>
        <Input
          id="organizer"
          name="organizer"
          value={formData.organizer}
          onChange={handleChange}
          placeholder="Wer organisiert das Event?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Kategorie *</Label>
        <Select
          value={formData.category}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Kategorie auswählen" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="link">Link</Label>
        <Input
          id="link"
          name="link"
          type="url"
          value={formData.link}
          onChange={handleChange}
          placeholder="https://..."
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <Button
          type="submit"
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Wird gespeichert...
            </>
          ) : (
            "Event erstellen"
          )}
        </Button>
        
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
};

export default EventForm;
