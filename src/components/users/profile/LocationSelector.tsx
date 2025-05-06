
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { X, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { extractAllLocations } from '@/utils/chatUtils';
import { useEventContext } from '@/contexts/EventContext';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
  
  // Filtered locations based on search term
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
    }
    setIsOpen(false);
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
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between bg-gray-900 border-gray-700 text-white relative"
          >
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span className="line-clamp-1 text-left">{searchTerm || "Lokation suchen..."}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-4 bg-gray-900 border border-gray-700"
          align="start"
          side="bottom"
          sideOffset={5}
          style={{ zIndex: 50 }}
        >
          <div className="space-y-4">
            <Input 
              type="text" 
              placeholder="Lokation suchen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
            />
            
            <ScrollArea className="h-[200px] rounded-md border border-gray-800">
              {filteredLocations.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">
                  Keine Lokationen gefunden
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredLocations.map((location) => (
                    <Button
                      key={location}
                      variant="ghost"
                      onClick={() => handleLocationSelect(location)}
                      className="w-full justify-start text-white hover:bg-gray-800 flex items-center gap-2"
                    >
                      <MapPin size={14} className="text-gray-400" />
                      <span>{location}</span>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LocationSelector;
