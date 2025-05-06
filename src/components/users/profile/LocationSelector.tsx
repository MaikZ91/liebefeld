
import React, { useState, useEffect, useRef } from 'react';
import { Badge } from "@/components/ui/badge";
import { X, MapPin, ChevronDown, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { extractAllLocations } from '@/utils/chatUtils';
import { useEventContext } from '@/contexts/EventContext';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";

interface LocationSelectorProps {
  locations: string[];
  favoriteLocations: string[];
  onLocationsChange: (locations: string[]) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations: providedLocations,
  favoriteLocations,
  onLocationsChange
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [commandOpen, setCommandOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { events } = useEventContext();
  const [allLocations, setAllLocations] = useState<string[]>([]);
  
  // Use both provided locations and extract from events
  useEffect(() => {
    // Start with provided locations
    const combinedLocations = [...providedLocations];
    
    // Extract locations from events if available
    if (events && events.length > 0) {
      const eventLocations = extractAllLocations(events);
      
      // Add event locations that aren't already in the list
      eventLocations.forEach(location => {
        if (!combinedLocations.includes(location)) {
          combinedLocations.push(location);
        }
      });
    }
    
    // Sort alphabetically
    const sortedLocations = combinedLocations.sort((a, b) => a.localeCompare(b));
    
    setAllLocations(sortedLocations);
    console.log(`[LocationSelector] Combined ${providedLocations.length} provided locations with locations from events for a total of ${sortedLocations.length} unique locations`);
  }, [providedLocations, events]);
  
  // Computed property for filtered locations
  const filteredLocations = allLocations.filter(location => 
    location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLocationSelect = (location: string) => {
    console.log('Location selected:', location);
    if (location && !favoriteLocations.includes(location)) {
      const updatedLocations = [...favoriteLocations, location];
      onLocationsChange(updatedLocations);
      
      // Save to localStorage for immediate use in personalization
      try {
        localStorage.setItem('user_locations', JSON.stringify(updatedLocations));
        console.log('[LocationSelector] Saved locations to localStorage:', updatedLocations);
      } catch (err) {
        console.error('[LocationSelector] Error saving to localStorage:', err);
      }
      
      // Clear search term after selection
      setSearchTerm('');
      setCommandOpen(false);
    }
    setPopoverOpen(false);
  };

  const handleRemoveLocation = (location: string) => {
    const updatedLocations = favoriteLocations.filter(loc => loc !== location);
    onLocationsChange(updatedLocations);
    
    // Update localStorage when removing a location
    try {
      localStorage.setItem('user_locations', JSON.stringify(updatedLocations));
      console.log('[LocationSelector] Updated locations in localStorage after removal:', updatedLocations);
    } catch (err) {
      console.error('[LocationSelector] Error updating localStorage:', err);
    }
  };

  // Alternative approach using Select component for smaller screens
  const handleSelectChange = (value: string) => {
    if (value && !favoriteLocations.includes(value)) {
      const updatedLocations = [...favoriteLocations, value];
      onLocationsChange(updatedLocations);
      
      // Save to localStorage for immediate use in personalization
      try {
        localStorage.setItem('user_locations', JSON.stringify(updatedLocations));
        console.log('[LocationSelector] Saved locations to localStorage from select:', updatedLocations);
      } catch (err) {
        console.error('[LocationSelector] Error saving to localStorage:', err);
      }
    }
  };
  
  // Synchronize the component with localStorage on mount
  useEffect(() => {
    try {
      const storedLocations = localStorage.getItem('user_locations');
      if (storedLocations) {
        const parsedLocations = JSON.parse(storedLocations);
        console.log('[LocationSelector] Retrieved locations from localStorage:', parsedLocations);
        
        // Only update if different from current state to avoid loops
        if (JSON.stringify(parsedLocations) !== JSON.stringify(favoriteLocations)) {
          onLocationsChange(parsedLocations);
        }
      }
    } catch (err) {
      console.error('[LocationSelector] Error reading from localStorage:', err);
    }
  }, []);
  
  // Focus the search input when the popover opens
  useEffect(() => {
    if (popoverOpen) {
      const searchInput = document.querySelector('.location-search-input') as HTMLInputElement;
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    }
  }, [popoverOpen]);
  
  return (
    <div className="space-y-2">
      <Label>Lieblingslokationen</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {favoriteLocations.map((location, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="bg-gray-800 border-gray-700 flex items-center gap-1"
          >
            {location}
            <X 
              size={14} 
              className="cursor-pointer text-gray-400 hover:text-red-400" 
              onClick={() => handleRemoveLocation(location)}
            />
          </Badge>
        ))}
      </div>
      
      {/* Modern Command Menu for location search on all screen sizes */}
      <Popover open={commandOpen} onOpenChange={setCommandOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between bg-gray-900 border-gray-700 text-white relative"
          >
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span>{searchTerm || "Lokation suchen..."}</span>
            </div>
            <Search className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-0 bg-gray-900 border border-gray-700"
          side="bottom"
          align="start"
          sideOffset={5}
        >
          <Command className="rounded-lg border-0 bg-transparent">
            <CommandInput 
              placeholder="Lokation suchen..." 
              className="h-9 text-white"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm text-gray-400">
                Keine Lokationen gefunden
              </CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {filteredLocations.map((location) => (
                  <CommandItem
                    key={location}
                    value={location}
                    onSelect={() => handleLocationSelect(location)}
                    className="flex items-center gap-2 cursor-pointer text-white hover:bg-gray-800"
                  >
                    <MapPin size={14} className="text-gray-400" />
                    <span>{location}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LocationSelector;
