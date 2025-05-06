
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { X, MapPin, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  
  // Computed property for filtered locations
  const filteredLocations = locations.filter(location => 
    location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLocationSelect = (location: string) => {
    console.log('Location selected:', location);
    if (location && !favoriteLocations.includes(location)) {
      onLocationsChange([...favoriteLocations, location]);
    }
    setPopoverOpen(false);
  };

  const handleRemoveLocation = (location: string) => {
    onLocationsChange(favoriteLocations.filter(loc => loc !== location));
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
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 focus:outline-none"
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
            <ScrollArea className="h-72 overflow-auto">
              <div className="p-1">
                {filteredLocations.map((location) => (
                  <div
                    key={location}
                    className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-800 rounded-sm text-sm"
                    onClick={() => handleLocationSelect(location)}
                  >
                    <MapPin size={14} />
                    <span>{location}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LocationSelector;
