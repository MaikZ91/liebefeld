
import React, { useState, useEffect, useRef } from 'react';
import { Badge } from "@/components/ui/badge";
import { X, MapPin, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationSelectorProps {
  locations: string[];
  favoriteLocations: string[];
  onLocationsChange: (locations: string[]) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  favoriteLocations,
  onLocationsChange
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Computed property for filtered locations
  const filteredLocations = locations.filter(location => 
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
      
      {/* For larger screens: Popover with ScrollArea */}
      <div className="hidden md:block">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between bg-gray-900 border-gray-700 text-white"
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{"Lokation auswählen"}</span>
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[300px] p-0 bg-gray-900 border border-gray-700"
            align="start"
          >
            <div className="flex items-center border-b border-gray-700 px-3">
              <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 focus:outline-none location-search-input"
                placeholder="Lokation suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {filteredLocations.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">
                Keine Lokationen gefunden
              </div>
            ) : (
              <ScrollArea className="h-72 rounded-md" ref={scrollAreaRef}>
                <div className="p-1">
                  {filteredLocations.map((location) => (
                    <button
                      key={location}
                      className="flex w-full items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-800 rounded-sm text-sm text-left"
                      onClick={() => handleLocationSelect(location)}
                      type="button"
                    >
                      <MapPin size={14} />
                      <span>{location}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </PopoverContent>
        </Popover>
      </div>
      
      {/* For smaller screens: Simple Select component */}
      <div className="block md:hidden">
        <Select onValueChange={handleSelectChange}>
          <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white">
            <SelectValue placeholder="Lokation auswählen" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700 text-white max-h-72">
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LocationSelector;
